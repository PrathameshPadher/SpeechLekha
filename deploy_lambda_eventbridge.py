import io
import json
import time
import zipfile
import boto3
from botocore.exceptions import ClientError

lam = boto3.client("lambda", region_name="ap-south-1")
ev = boto3.client("events", region_name="ap-south-1")

FUNCTION_NAME = "speechlekha-finalizer"
ROLE_ARN = "arn:aws:iam::808101329680:role/speechlekha-lambda-role"

# 1. Package lambda_function.py into zip buffer
print(f"Packaging {FUNCTION_NAME}...")
buffer = io.BytesIO()
with zipfile.ZipFile(buffer, "w", zipfile.ZIP_DEFLATED) as z:
    with open("lambda_function.py", "r", encoding="utf-8") as f:
        z.writestr("lambda_function.py", f.read())
zip_bytes = buffer.getvalue()

def wait_for_function():
    while True:
        status = lam.get_function(FunctionName=FUNCTION_NAME)["Configuration"]["LastUpdateStatus"]
        if status in ("Successful", "Active"):
            break
        print(f"Waiting for function update: {status}...")
        time.sleep(2)

# 2. Create or Update Lambda Function
try:
    lam.create_function(
        FunctionName=FUNCTION_NAME,
        Runtime="python3.12",
        Role=ROLE_ARN,
        Handler="lambda_function.lambda_handler",
        Code={"ZipFile": zip_bytes},
        Timeout=60,
        MemorySize=256,
        Description="SpeechLekha Finalizer: Transcribe trigger & DynamoDB completion"
    )
    print(f"Created Lambda function: {FUNCTION_NAME}")
except ClientError as e:
    if e.response["Error"]["Code"] == "ResourceConflictException":
        print("Function already exists, updating code...")
        wait_for_function()
        lam.update_function_code(FunctionName=FUNCTION_NAME, ZipFile=zip_bytes)
        wait_for_function()
        print(f"Updated code for Lambda function: {FUNCTION_NAME}")
    else:
        raise

# 3. Setup EventBridge Rule
RULE_NAME = "speechlekha-transcribe-done"
print(f"Setting up EventBridge rule: {RULE_NAME}...")

rule_res = ev.put_rule(
    Name=RULE_NAME,
    EventPattern=json.dumps({
        "source": ["aws.transcribe"],
        "detail-type": ["Transcribe Job State Change"]
    }),
    State="ENABLED",
    Description="Trigger speechlekha-finalizer when Amazon Transcribe job state changes"
)
rule_arn = rule_res["RuleArn"]
print(f"Put EventBridge rule: {rule_arn}")

# 4. Add Lambda permission for EventBridge
try:
    lam.add_permission(
        FunctionName=FUNCTION_NAME,
        StatementId="allow-transcribe-events",
        Action="lambda:InvokeFunction",
        Principal="events.amazonaws.com",
        SourceArn=rule_arn
    )
    print("Added permission for EventBridge to invoke Lambda.")
except ClientError as e:
    if e.response["Error"]["Code"] == "ResourceConflictException":
        print("Permission allow-transcribe-events already exists.")
    else:
        raise

# 5. Wire Rule Target
fn_res = lam.get_function(FunctionName=FUNCTION_NAME)
fn_arn = fn_res["Configuration"]["FunctionArn"]

ev.put_targets(
    Rule=RULE_NAME,
    Targets=[{"Id": "1", "Arn": fn_arn}]
)
print("EventBridge target wired to Lambda successfully!")
