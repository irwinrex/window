import paramiko
import io


def load_private_key(key_str: str):
    key_classes = [
        paramiko.RSAKey,
        paramiko.ECDSAKey,
        paramiko.Ed25519Key,
        paramiko.DSSKey
    ]
    for key_class in key_classes:
        try:
            return key_class.from_private_key(io.StringIO(key_str))
        except paramiko.ssh_exception.SSHException:
            continue
    raise ValueError("Invalid or unsupported private key format")


def transfer_file_through_bastion(
    bastion_host: str,
    target_host: str,
    username_bastion: str,
    username_target: str,
    bastion_key_content: str,
    target_key_content: str,
    file_content: str,
    remote_path: str
):
    bastion_key = load_private_key(bastion_key_content)
    target_key = load_private_key(target_key_content)

    with paramiko.SSHClient() as bastion:
        bastion.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        bastion.connect(bastion_host, username=username_bastion, pkey=bastion_key)

        bastion_transport = bastion.get_transport()
        dest_addr = (target_host, 22)
        local_addr = (bastion_host, 22)
        channel = bastion_transport.open_channel("direct-tcpip", dest_addr, local_addr)

        with paramiko.SSHClient() as target:
            target.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            target.connect(target_host, username=username_target, sock=channel, pkey=target_key)

            with target.open_sftp() as sftp:
                with sftp.file(remote_path, "w") as remote_file:
                    remote_file.write(file_content)


def download_file_through_bastion(
    bastion_host: str,
    target_host: str,
    username_bastion: str,
    username_target: str,
    bastion_key_content: str,
    target_key_content: str,
    remote_path: str
) -> str:
    bastion_key = load_private_key(bastion_key_content)
    target_key = load_private_key(target_key_content)

    with paramiko.SSHClient() as bastion:
        bastion.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        bastion.connect(bastion_host, username=username_bastion, pkey=bastion_key)

        bastion_transport = bastion.get_transport()
        dest_addr = (target_host, 22)
        local_addr = (bastion_host, 22)
        channel = bastion_transport.open_channel("direct-tcpip", dest_addr, local_addr)

        with paramiko.SSHClient() as target:
            target.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            target.connect(target_host, username=username_target, sock=channel, pkey=target_key)

            with target.open_sftp() as sftp:
                with sftp.file(remote_path, "r") as remote_file:
                    content = remote_file.read()

    return content.decode("utf-8", errors="replace")


# Optional alias for consistency with main.py
upload_file_through_bastion = transfer_file_through_bastion
