from fastapi import FastAPI, Form, UploadFile, HTTPException, File, Request, Query
from pydantic import BaseModel
import hvac, base64, os, re
from typing import List, Set
from ssh_utils import transfer_file_through_bastion, download_file_through_bastion, upload_file_through_bastion
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

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://vault:8200")
VAULT_TOKEN_FILE = os.getenv("VAULT_TOKEN_FILE", "/vault/file/app_token")

if VAULT_TOKEN_FILE and os.path.exists(VAULT_TOKEN_FILE):
    with open(VAULT_TOKEN_FILE, "r") as f:
        VAULT_TOKEN = f.read().strip()
else:
    VAULT_TOKEN = os.getenv("VAULT_TOKEN", "root-token")

client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)

def is_pem_format(key_content: str) -> bool:
    pem_pattern = r"-----BEGIN [A-Z ]+-----\r?\n([A-Za-z0-9+/=\r\n]+)-----END [A-Z ]+-----"
    return re.search(pem_pattern, key_content.strip()) is not None

class UpdateFileRequest(BaseModel):
    filename: str
    content: str

# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     return JSONResponse(
#         status_code=422,
#         content={"detail": exc.errors(), "body": exc.body},
#     )
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=422,
        content={
            "detail": exc.errors(),
            "body": str(exc.body),
        },
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
    
    # Validate vault app token exists and is valid
    if not client.is_authenticated():
        raise HTTPException(status_code=500, detail="Vault authentication failed. Please check Vault token and address.")

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
        import traceback
        tb = traceback.format_exc()
        # Check for permission denied
        if hasattr(e, 'errors') and any('permission denied' in err.lower() for err in e.errors):
            raise HTTPException(status_code=403, detail=(e.errors))
        elif 'permission denied' in str(e).lower():
            raise HTTPException(status_code=403, detail="Permission denied when storing secrets in Vault. Please check Vault policy and token.")
        else:
            # Log traceback for debugging (could be to a file or monitoring system)
            print(f"Vault error while storing secrets: {e}\nTraceback: {tb}")
            raise HTTPException(status_code=500, detail=f"Failed to store secrets in Vault: {str(e)}")

    return {"status": f"{target_id}_secrets stored in Vault"}

@app.post("/download-file/{target_id}")
async def download_file(target_id: str, remote_path: str = Form(...)):
    if not remote_path.strip():
        raise HTTPException(status_code=400, detail="remote_path cannot be empty")

    try:
        secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/targets/{target_id}_secrets")
        secrets = secret_response['data']['data']
    except Exception:
        raise HTTPException(status_code=404, detail="Secrets not found for Server access")

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

    encoded_file = base64.b64encode(content.encode() if isinstance(content, str) else content).decode()
    filename = os.path.basename(remote_path)
    vault_path = f"ssh/downloads/{target_id}_{filename}"

    try:
        client.secrets.kv.v2.create_or_update_secret(
            path=vault_path,
            secret={"filename": filename, "base64_content": encoded_file}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file to Vault: {str(e)}")

    return {"status": "stored", "vault_path": vault_path}

@app.post("/upload-to-server/{target_id}")
async def upload_to_server(
    target_id: str,
    filename: str = Form(...),
    remote_path: str = Form(...)
):
    if not remote_path.strip():
        raise HTTPException(status_code=400, detail="remote_path cannot be empty")
    if not filename.strip():
        raise HTTPException(status_code=400, detail="filename cannot be empty")

    # Check if the alias (target_id) matches the file's alias
    # The file must be in the form {target_id}_filename in ssh/uploads
    expected_prefix = f"{target_id}_"
    if not filename or not filename.startswith(expected_prefix):
        raise HTTPException(status_code=400, detail="Filename does not match the target_id alias.")
    # Remove the alias prefix for the actual filename on the server
    actual_filename = filename[len(expected_prefix):]
    vault_path = f"ssh/uploads/{filename}"

    # Step 1: Read from Vault
    try:
        vault_data = client.secrets.kv.v2.read_secret_version(path=vault_path)
        base64_content = vault_data['data']['data']['base64_content']
        content = base64.b64decode(base64_content).decode()
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Failed to read file from Vault: {str(e)}")

    # Step 2: Get server secrets
    try:
        secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/targets/{target_id}_secrets")
        secrets = secret_response['data']['data']
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Secrets not found for Server access: {str(e)}")

    # Step 3: Transfer to server via Bastion
    try:
        transfer_file_through_bastion(
            bastion_host=secrets['bastion_host'],
            target_host=secrets['target_host'],
            username_bastion=secrets['username_bastion'],
            username_target=secrets['username_target'],
            bastion_key_content=secrets['bastion_key'],
            target_key_content=secrets['target_key'],
            remote_path=remote_path,
            file_content=content
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file to server: {str(e)}")

    return {"status": "uploaded_from_vault_to_server", "filename": actual_filename, "vault_path": vault_path}

@app.get("/fetch-file/{target_id}", response_class=PlainTextResponse)
async def fetch_file(target_id: str, filename: str = Query(...)):
    vault_path = f"ssh/downloads/{target_id}_{filename}"
    try:
        secret = client.secrets.kv.v2.read_secret_version(path=vault_path)
        encoded_content = secret['data']['data'].get('base64_content')

        if not encoded_content:
            raise HTTPException(status_code=404, detail="File content not found in Vault")

        content_bytes = base64.b64decode(encoded_content)
        return content_bytes.decode('utf-8', errors='replace')

    except InvalidPath:
        raise HTTPException(status_code=404, detail="Vault path does not exist")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@app.get("/list-files/{target_id}", response_model=List[str])
async def list_files(target_id: str):
    try:
        response = client.secrets.kv.v2.list_secrets(path="ssh/downloads")
        keys = response['data'].get('keys', [])
        filtered_files = [
            key[len(target_id)+1:] for key in keys if key.startswith(f"{target_id}_") and not key.endswith("/")
        ]
        if not filtered_files:
            raise HTTPException(status_code=404, detail="No files found for target_id")
        return sorted(filtered_files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.get("/list-targets", response_model=List[str])
async def list_targets():
    try:
        response = client.secrets.kv.v2.list_secrets(path="ssh/targets")
        keys = response['data'].get('keys', [])
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

@app.post("/update-file/{target_id}")
async def update_file(target_id: str, req: UpdateFileRequest):
    try:
        print(f"Received request to update file: {req.filename} with content: {req.content}")
        encoded_content = base64.b64encode(req.content.encode("utf-8")).decode("utf-8")
        vault_path = f"ssh/uploads/{target_id}_{req.filename}"
        client.secrets.kv.v2.create_or_update_secret(
            path=vault_path,
            secret={"base64_content": encoded_content}
        )
        return {"status": "success", "message": "Vault updated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update Vault: {str(e)}")

@app.get("/list-uploaded-files/{target_id}", response_model=List[str])
async def list_uploaded_files(target_id: str):
    try:
        response = client.secrets.kv.v2.list_secrets(path="ssh/uploads")
        keys = response['data'].get('keys', [])
        filtered_files = [
            key[len(target_id)+1:] for key in keys if key.startswith(f"{target_id}_") and not key.endswith("/")
        ]
        if not filtered_files:
            raise HTTPException(status_code=404, detail="No uploaded files found for target_id")
        return sorted(filtered_files)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error listing uploaded files: {str(e)}")

@app.get("/fetch-uploaded-file/{target_id}", response_class=PlainTextResponse)
async def fetch_uploaded_file(target_id: str, filename: str = Query(...)):
    vault_path = f"ssh/uploads/{target_id}_{filename}"
    try:
        secret = client.secrets.kv.v2.read_secret_version(path=vault_path)
        encoded_content = secret['data']['data'].get('base64_content')
        if not encoded_content:
            raise HTTPException(status_code=404, detail="File content not found in Vault")
        content_bytes = base64.b64decode(encoded_content)
        return content_bytes.decode('utf-8', errors='replace')
    except InvalidPath:
        raise HTTPException(status_code=404, detail="Vault path does not exist")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")