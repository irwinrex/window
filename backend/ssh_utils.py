import paramiko
import io

def load_private_key(key_str):
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
    bastion_host, target_host,
    username_bastion, username_target,
    bastion_key_content, target_key_content,
    file_content, remote_path
):
    bastion = paramiko.SSHClient()
    bastion.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    bastion_key = load_private_key(bastion_key_content)
    bastion.connect(bastion_host, username=username_bastion, pkey=bastion_key)

    bastion_transport = bastion.get_transport()
    dest_addr = (target_host, 22)
    local_addr = (bastion_host, 22)
    channel = bastion_transport.open_channel("direct-tcpip", dest_addr, local_addr)

    target = paramiko.SSHClient()
    target.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    target_key = load_private_key(target_key_content)
    target.connect(target_host, username=username_target, sock=channel, pkey=target_key)

    sftp = target.open_sftp()
    with sftp.file(remote_path, "w") as remote_file:
        remote_file.write(file_content)
    sftp.close()
    target.close()
    bastion.close()

def download_file_through_bastion(
    bastion_host, target_host,
    username_bastion, username_target,
    bastion_key_content, target_key_content,
    remote_path
) -> str:
    bastion = paramiko.SSHClient()
    bastion.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    bastion_key = load_private_key(bastion_key_content)
    bastion.connect(bastion_host, username=username_bastion, pkey=bastion_key)

    bastion_transport = bastion.get_transport()
    dest_addr = (target_host, 22)
    local_addr = (bastion_host, 22)
    channel = bastion_transport.open_channel("direct-tcpip", dest_addr, local_addr)

    target = paramiko.SSHClient()
    target.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    target_key = load_private_key(target_key_content)
    target.connect(target_host, username=username_target, sock=channel, pkey=target_key)

    sftp = target.open_sftp()
    with sftp.file(remote_path, "r") as remote_file:
        content = remote_file.read()
    sftp.close()
    target.close()
    bastion.close()

    return content.decode()  # decode bytes to str
