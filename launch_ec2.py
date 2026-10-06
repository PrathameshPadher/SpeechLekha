import boto3
import os
import time
from botocore.exceptions import ClientError

REGION = "ap-south-1"
ec2 = boto3.client("ec2", region_name=REGION)

KEY_NAME = "speechlekha"
SG_NAME = "speechlekha-sg"
AMI_ID = "ami-007b1f3fdea0383d9"  # Canonical Ubuntu 24.04 LTS in ap-south-1
INSTANCE_TYPE = "t3.small"  # Free-Tier Eligible in ap-south-1 (2 vCPU, 2GB RAM)
USER_IP = "49.32.198.192"

print(f"=== SpeechLekha EC2 Provisioning ({REGION}) ===")

# 1. Key Pair
try:
    key_resp = ec2.create_key_pair(KeyName=KEY_NAME)
    pem_path = "speechlekha.pem"
    with open(pem_path, "w", encoding="utf-8") as f:
        f.write(key_resp["KeyMaterial"])
    print(f"[OK] Created key pair: {KEY_NAME} -> saved to {pem_path}")
except ClientError as e:
    if e.response["Error"]["Code"] == "InvalidKeyPair.Duplicate":
        print(f"[OK] Key pair {KEY_NAME} already exists.")
    else:
        raise

# 2. Security Group
try:
    sg_resp = ec2.create_security_group(
        GroupName=SG_NAME,
        Description="Security group for SpeechLekha Demo (HTTP 80 and SSH 22)"
    )
    sg_id = sg_resp["GroupId"]
    print(f"[OK] Created Security Group: {SG_NAME} ({sg_id})")
except ClientError as e:
    if e.response["Error"]["Code"] == "InvalidGroup.Duplicate":
        sgs = ec2.describe_security_groups(GroupNames=[SG_NAME])
        sg_id = sgs["SecurityGroups"][0]["GroupId"]
        print(f"[OK] Security Group {SG_NAME} already exists: {sg_id}")
    else:
        raise

# Authorize ingress rules (Port 80 to world, Port 22 for SSH)
ip_permissions = [
    {
        "IpProtocol": "tcp",
        "FromPort": 80,
        "ToPort": 80,
        "IpRanges": [{"CidrIp": "0.0.0.0/0", "Description": "HTTP Web UI"}]
    },
    {
        "IpProtocol": "tcp",
        "FromPort": 22,
        "ToPort": 22,
        "IpRanges": [
            {"CidrIp": f"{USER_IP}/32", "Description": "SSH from user IP"},
            {"CidrIp": "0.0.0.0/0", "Description": "SSH fallback"}
        ]
    }
]

for perm in ip_permissions:
    try:
        ec2.authorize_security_group_ingress(
            GroupId=sg_id,
            IpPermissions=[perm]
        )
        print(f"[OK] Ingress rule port {perm['FromPort']} authorized.")
    except ClientError as e:
        if e.response["Error"]["Code"] == "InvalidPermission.Duplicate":
            pass
        else:
            print(f"Notice on port {perm['FromPort']}: {e}")

# 3. Read bootstrap script
with open("bootstrap.sh", "r", encoding="utf-8") as f:
    user_data = f.read()

# 4. Check if instance already exists
existing = ec2.describe_instances(
    Filters=[
        {"Name": "tag:Name", "Values": ["speechlekha"]},
        {"Name": "instance-state-name", "Values": ["pending", "running"]}
    ]
)

reservations = existing.get("Reservations", [])
if reservations and reservations[0].get("Instances"):
    inst = reservations[0]["Instances"][0]
    inst_id = inst["InstanceId"]
    pub_ip = inst.get("PublicIpAddress", "Pending")
    print(f"\n[OK] Instance already exists ({inst['State']['Name']}): {inst_id} (IP: {pub_ip})")
else:
    print(f"\nLaunching {INSTANCE_TYPE} instance with 30GB gp3 root volume in {REGION}...")
    run_resp = ec2.run_instances(
        ImageId=AMI_ID,
        InstanceType=INSTANCE_TYPE,
        KeyName=KEY_NAME,
        SecurityGroupIds=[sg_id],
        IamInstanceProfile={"Name": "speechlekha-ec2-role"},
        BlockDeviceMappings=[{
            "DeviceName": "/dev/sda1",
            "Ebs": {
                "VolumeSize": 30,
                "VolumeType": "gp3",
                "DeleteOnTermination": True
            }
        }],
        TagSpecifications=[{
            "ResourceType": "instance",
            "Tags": [{"Key": "Name", "Value": "speechlekha"}]
        }],
        UserData=user_data,
        MinCount=1,
        MaxCount=1
    )
    inst_id = run_resp["Instances"][0]["InstanceId"]
    print(f"[OK] Instance requested: {inst_id}. Waiting for instance to enter 'running' state...")

    waiter = ec2.get_waiter("instance_running")
    waiter.wait(InstanceIds=[inst_id])

    inst_desc = ec2.describe_instances(InstanceIds=[inst_id])
    pub_ip = inst_desc["Reservations"][0]["Instances"][0].get("PublicIpAddress")
    print("\n" + "=" * 55)
    print(f" SUCCESS: EC2 INSTANCE IS RUNNING!")
    print(f" Instance ID: {inst_id}")
    print(f" Public IP:   {pub_ip}")
    print(f" Web UI URL:  http://{pub_ip}/")
    print("=" * 55)
    print("The bootstrap script is now installing packages, Ollama, and models.")
    print("Estimated bootstrap duration: ~8-10 minutes.")
