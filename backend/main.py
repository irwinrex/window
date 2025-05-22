from fastapi import FastAPI, Form, UploadFile, HTTPException, File , Request, Query
from pydantic import BaseModel
import hvac, base64, os, re
from typing import List
from ssh_utils import transfer_file_through_bastion, download_file_through_bastion
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse, PlainTextResponse
from fastapi.middleware.cors import CORSMiddleware
from hvac.exceptions import InvalidPath

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://localhost:8200")
VAULT_TOKEN = os.getenv("VAULT_TOKEN", "root-token")

client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)

def is_pem_format(key_content: str) -> bool:
    # Improved PEM format checker using regex
    pem_pattern = r"-----BEGIN [A-Z ]+-----\r?\n([A-Za-z0-9+/=\r\n]+)-----END [A-Z ]+-----"
    return re.search(pem_pattern, key_content.strip()) is not None

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    # Return a JSON response for validation errors (missing fields, wrong types)
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors(), "body": exc.body},
    )

@app.post("/add-server")
async def add_server(
    target_id: str = Form(...),
    bastion_host: str = Form(...),
    target_host: str = Form(...),
    username_bastion: str = Form(...),
    username_target: str = Form(...),
    bastion_key_file: UploadFile = File(...),
    target_key_file: UploadFile = File(...),
):
    try:
        bastion_key_content = (await bastion_key_file.read()).decode()
        target_key_content = (await target_key_file.read()).decode()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading uploaded files: {str(e)}")

    if not bastion_key_content.strip():
        raise HTTPException(status_code=400, detail="Bastion key file is empty")
    if not target_key_content.strip():
        raise HTTPException(status_code=400, detail="Target key file is empty")

    if not is_pem_format(bastion_key_content):
        raise HTTPException(status_code=400, detail="Bastion key is not in valid PEM format")
    if not is_pem_format(target_key_content):
        raise HTTPException(status_code=400, detail="Target key is not in valid PEM format")

    secret_data = {
        "bastion_host": bastion_host,
        "target_host": target_host,
        "username_bastion": username_bastion,
        "username_target": username_target,
        "bastion_key": bastion_key_content,
        "target_key": target_key_content,
    }

    try:
        client.secrets.kv.v2.create_or_update_secret(path=f"ssh/targets/{target_id}_secrets", secret=secret_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to store secrets in Vault: {str(e)}")

    return {"status": f"{target_id}_secrets stored in Vault"}

# @app.post("/upload-file/{target_id}")
# async def upload_file(
#     target_id: str,
#     content: str = Form(...),
#     remote_path: str = Form(...)
# ):
#     try:
#         secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/{target_id}_secrets")
#     except Exception:
#         raise HTTPException(status_code=404, detail="Secrets not found for target_id")

#     secrets = secret_response['data']['data']

#     transfer_file_through_bastion(
#         bastion_host=secrets['bastion_host'],
#         target_host=secrets['target_host'],
#         username_bastion=secrets['username_bastion'],
#         username_target=secrets['username_target'],
#         bastion_key_content=secrets['bastion_key'],
#         target_key_content=secrets['target_key'],
#         file_content=content,
#         remote_path=remote_path
#     )
#     return {"status": "file uploaded"}

@app.post("/download-file/{target_id}")
async def download_file(
    target_id: str,
    remote_path: str = Form(...)
):
    if not remote_path.strip():
        raise HTTPException(status_code=400, detail="remote_path cannot be empty")

    # Fetch SSH secrets
    try:
        secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/targets/{target_id}_secrets")
        secrets = secret_response['data']['data']
    except Exception:
        raise HTTPException(status_code=404, detail="Secrets not found for Server access")

    # Download file content
    try:
        content = download_file_through_bastion(
            bastion_host=secrets['bastion_host'],
            target_host=secrets['target_host'],
            username_bastion=secrets['username_bastion'],
            username_target=secrets['username_target'],
            bastion_key_content=secrets['bastion_key'],
            target_key_content=secrets['target_key'],
            remote_path=remote_path
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download file: {str(e)}")

    if not content:
        raise HTTPException(status_code=404, detail="Downloaded file is empty or does not exist")

    # Encode file content in base64 (safe for binary)
    encoded_file = base64.b64encode(content.encode() if isinstance(content, str) else content).decode()

    filename = os.path.basename(remote_path)
    vault_path = f"ssh/downloads/{target_id}_{filename}"

    # Save encoded content to Vault
    try:
        client.secrets.kv.v2.create_or_update_secret(
            path=vault_path,
            secret={"filename": filename, "base64_content": encoded_file}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Vault: {str(e)}")

    return {"status": "stored", "vault_path": vault_path}

@app.get("/fetch-file/{target_id}", response_class=PlainTextResponse)
async def fetch_file(
    target_id: str,
    filename: str = Query(..., description="Filename to fetch")
):
    vault_path = f"ssh/downloads/{target_id}_{filename}"
    try:
        secret = client.secrets.kv.v2.read_secret_version(path=vault_path)
        encoded_content = secret['data']['data'].get('base64_content')

        if not encoded_content:
            raise HTTPException(status_code=404, detail="File content not found in Vault")

        content_bytes = base64.b64decode(encoded_content)
        content_str = content_bytes.decode('utf-8', errors='replace')

        return content_str

    except InvalidPath:
        raise HTTPException(status_code=404, detail="Vault path does not exist")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/list-files/{target_id}", response_model=List[str])
async def list_files(target_id: str):
    try:
        response = client.secrets.kv.v2.list_secrets(path="ssh/downloads")
        keys = response['data'].get('keys', [])
        
        # Filter keys that start with target_id_ and exclude folders (keys ending with '/')
        filtered_files = [
            key[len(target_id) + 1 :]
            for key in keys
            if key.startswith(f"{target_id}_") and not key.endswith("/")
        ]
        
        if not filtered_files:
            raise HTTPException(status_code=404, detail="No files found for target_id")
        
        return sorted(filtered_files)

    except Exception as e:
        # Optionally log error here
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.get("/list-targets", response_model=List[str])
async def list_targets():
    try:
        response = client.secrets.kv.v2.list_secrets(path="ssh/targets")
        keys = response['data'].get('keys', [])
        
        # Extract unique target_id prefixes from keys like targetid_filename
        target_ids: Set[str] = set()
        for key in keys:
            if not key.endswith("/") and "_" in key:
                target_id = key.split("_", 1)[0]
                target_ids.add(target_id)

        if not target_ids:
            raise HTTPException(status_code=404, detail="No target_ids found")

        return sorted(list(target_ids))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing target_ids: {str(e)}")