import json
import boto3
from botocore.exceptions import ClientError

iam = boto3.client("iam")
ACCT = "808101329680"
REGION = "ap-south-1"
BUCKET = f"speechlekha-data-{ACCT}"

print(f"Setting up IAM for Account {ACCT}, Bucket {BUCKET}...")

# 1. EC2 Trust Policy & Role
trust_ec2 = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "ec2.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

ec2_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["s3:PutObject", "s3:GetObject"],
            "Resource": f"arn:aws:s3:::{BUCKET}/*"
        },
        {
            "Effect": "Allow",
            "Action": ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:GetItem", "dynamodb:Query"],
            "Resource": [
                f"arn:aws:dynamodb:{REGION}:{ACCT}:table/Sessions",
                f"arn:aws:dynamodb:{REGION}:{ACCT}:table/Chunks"
            ]
        },
        {
            "Effect": "Allow",
            "Action": ["lambda:InvokeFunction"],
            "Resource": f"arn:aws:lambda:{REGION}:{ACCT}:function:speechlekha-finalizer"
        }
    ]
}

try:
    iam.create_role(
        RoleName="speechlekha-ec2-role",
        AssumeRolePolicyDocument=json.dumps(trust_ec2)
    )
    print("Created role: speechlekha-ec2-role")
except ClientError as e:
    if e.response["Error"]["Code"] == "EntityAlreadyExists":
        print("Role speechlekha-ec2-role already exists.")
    else:
        raise

iam.put_role_policy(
    RoleName="speechlekha-ec2-role",
    PolicyName="speechlekha-ec2",
    PolicyDocument=json.dumps(ec2_policy)
)
print("Attached policy: speechlekha-ec2 to speechlekha-ec2-role")

try:
    iam.create_instance_profile(InstanceProfileName="speechlekha-ec2-role")
    print("Created instance profile: speechlekha-ec2-role")
except ClientError as e:
    if e.response["Error"]["Code"] == "EntityAlreadyExists":
        print("Instance profile speechlekha-ec2-role already exists.")
    else:
        raise

try:
    iam.add_role_to_instance_profile(
        InstanceProfileName="speechlekha-ec2-role",
        RoleName="speechlekha-ec2-role"
    )
    print("Added role to instance profile.")
except ClientError as e:
    if e.response["Error"]["Code"] == "LimitExceeded":
        print("Role already attached to instance profile.")
    else:
        raise

# 2. Lambda Trust Policy & Role
trust_lambda = {
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Principal": {"Service": "lambda.amazonaws.com"},
        "Action": "sts:AssumeRole"
    }]
}

lambda_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": ["s3:GetObject", "s3:PutObject"],
            "Resource": f"arn:aws:s3:::{BUCKET}/*"
        },
        {
            "Effect": "Allow",
            "Action": ["transcribe:StartTranscriptionJob", "transcribe:GetTranscriptionJob"],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": ["dynamodb:UpdateItem"],
            "Resource": f"arn:aws:dynamodb:{REGION}:{ACCT}:table/Sessions"
        }
    ]
}

try:
    iam.create_role(
        RoleName="speechlekha-lambda-role",
        AssumeRolePolicyDocument=json.dumps(trust_lambda)
    )
    print("Created role: speechlekha-lambda-role")
except ClientError as e:
    if e.response["Error"]["Code"] == "EntityAlreadyExists":
        print("Role speechlekha-lambda-role already exists.")
    else:
        raise

iam.put_role_policy(
    RoleName="speechlekha-lambda-role",
    PolicyName="speechlekha-lambda",
    PolicyDocument=json.dumps(lambda_policy)
)
print("Attached policy: speechlekha-lambda to speechlekha-lambda-role")
print("IAM SETUP COMPLETED SUCCESSFULLY!")
