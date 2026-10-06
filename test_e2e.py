import urllib.request
import json
import time

BASE_URL = "http://3.110.188.91"

print(f"=== Testing SpeechLekha Live API at {BASE_URL} ===")

# 1. Health check
resp = urllib.request.urlopen(f"{BASE_URL}/", timeout=5)
assert resp.status == 200, f"Expected 200, got {resp.status}"
print("[PASS] 1. Root UI reachable (HTTP 200)")

# 2. Create session
req = urllib.request.Request(f"{BASE_URL}/session", data=b"", method="POST")
session_data = json.loads(urllib.request.urlopen(req, timeout=5).read().decode("utf-8"))
sid = session_data["session_id"]
print(f"[PASS] 2. Session created: {sid}")

# 3. Check files tree
files_resp = json.loads(urllib.request.urlopen(f"{BASE_URL}/files/{sid}", timeout=5).read().decode("utf-8"))
assert "00-index.md" in files_resp["tree"], f"00-index.md not found in {files_resp['tree']}"
print(f"[PASS] 3. File tree verified: {files_resp['tree']}")

# 4. Check DynamoDB Session record
import boto3
ddb = boto3.resource("dynamodb", region_name="ap-south-1")
table = ddb.Table("Sessions")
item = table.get_item(Key={"session_id": sid}).get("Item")
print(f"[PASS] 4. DynamoDB Session verified: status={item.get('status')}, created_at={item.get('created_at')}")

# 5. Test Session End and Archival
end_req = urllib.request.Request(f"{BASE_URL}/session/{sid}/end", data=b"", method="POST")
end_resp = json.loads(urllib.request.urlopen(end_req, timeout=10).read().decode("utf-8"))
print(f"[PASS] 5. Session End completed: {end_resp['status']}")

# 6. Verify S3 Final Transcript upload
s3 = boto3.client("s3", region_name="ap-south-1")
BUCKET = "speechlekha-data-808101329680"
obj = s3.get_object(Bucket=BUCKET, Key=f"{sid}/final_transcript.txt")
transcript_text = obj["Body"].read().decode("utf-8")
print(f"[PASS] 6. S3 Archival Transcript verified: length={len(transcript_text)} bytes")

# 7. Check DynamoDB Session Status updated to 'completed'
updated_item = table.get_item(Key={"session_id": sid}).get("Item")
assert updated_item.get("status") == "completed", f"Status is {updated_item.get('status')}"
print(f"[PASS] 7. DynamoDB Session status confirmed 'completed', key={updated_item.get('transcript_key')}")

print("\n" + "=" * 50)
print(" ALL END-TO-END VERIFICATION CHECKS PASSED! ")
print("=" * 50)
