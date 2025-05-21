from fastapi import FastAPI, Form, UploadFile, HTTPException, File
from pydantic import BaseModel
import hvac
import os
import re
from ssh_utils import transfer_file_through_bastion, download_file_through_bastion

app = FastAPI()

VAULT_ADDR = os.getenv("VAULT_ADDR", "http://localhost:8200")
VAULT_TOKEN = os.getenv("VAULT_TOKEN", "root-token")

client = hvac.Client(url=VAULT_ADDR, token=VAULT_TOKEN)

def is_pem_format(key_content: str) -> bool:
    return bool(re.search(r"-----BEGIN [A-Z ]+PRIVATE KEY-----.*-----END [A-Z ]+PRIVATE KEY-----", key_content, re.DOTALL))

@app.post("/upload-secrets")
async def upload_secrets(
    target_id: str = Form(...),
    bastion_host: str = Form(...),
    target_host: str = Form(...),
    username_bastion: str = Form(...),
    username_target: str = Form(...),
    bastion_key_file: UploadFile = File(...),
    target_key_file: UploadFile = File(...),
):
    bastion_key_content = (await bastion_key_file.read()).decode()
    target_key_content = (await target_key_file.read()).decode()

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

    client.secrets.kv.v2.create_or_update_secret(path=f"ssh/{target_id}", secret=secret_data)
    return {"status": "secrets stored"}

@app.post("/upload-file/{target_id}")
async def upload_file(
    target_id: str,
    content: str = Form(...),
    remote_path: str = Form(...)
):
    try:
        secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/{target_id}")
    except Exception:
        raise HTTPException(status_code=404, detail="Secrets not found for target_id")

    secrets = secret_response['data']['data']

    transfer_file_through_bastion(
        bastion_host=secrets['bastion_host'],
        target_host=secrets['target_host'],
        username_bastion=secrets['username_bastion'],
        username_target=secrets['username_target'],
        bastion_key_content=secrets['bastion_key'],
        target_key_content=secrets['target_key'],
        file_content=content,
        remote_path=remote_path
    )
    return {"status": "file uploaded"}

@app.post("/download-file/{target_id}")
async def download_file(
    target_id: str,
    remote_path: str = Form(...)
):
    try:
        secret_response = client.secrets.kv.v2.read_secret_version(path=f"ssh/{target_id}")
    except Exception:
        raise HTTPException(status_code=404, detail="Secrets not found for target_id")

    secrets = secret_response['data']['data']

    content = download_file_through_bastion(
        bastion_host=secrets['bastion_host'],
        target_host=secrets['target_host'],
        username_bastion=secrets['username_bastion'],
        username_target=secrets['username_target'],
        bastion_key_content=secrets['bastion_key'],
        target_key_content=secrets['target_key'],
        remote_path=remote_path
    )
    # return {"content": content}
    # Load env and construct full path
    download_dir = os.getenv("DOWNLOAD_DIR", "/tmp")
    filename = os.path.basename(remote_path)
    output_path = os.path.join(download_dir, f"{target_id}_{filename}")

    # Save content
    with open(output_path, "w") as f:
        f.write(content)

    return {"status": "downloaded", "saved_to": output_path}
