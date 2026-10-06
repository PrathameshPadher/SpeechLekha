import time
import boto3
from botocore.exceptions import ClientError

tr = boto3.client("transcribe", region_name="ap-south-1")
VOCAB_NAME = "eng-math-vocab"

PHRASES = [
    "eigenvalue", "eigenvector", "Laplace transform", "Fourier series",
    "Gaussian elimination", "Newton-Raphson", "partial derivative",
    "differential equation", "Maclaurin series", "Taylor series", "convergence",
    "bisection method", "Jacobian", "determinant", "vector space", "continuity"
]

print(f"Creating Amazon Transcribe custom vocabulary: {VOCAB_NAME}...")
try:
    tr.create_vocabulary(
        VocabularyName=VOCAB_NAME,
        LanguageCode="en-US",
        Phrases=PHRASES
    )
    print("Vocabulary creation initiated. Waiting for state to become READY...")
except ClientError as e:
    if e.response["Error"]["Code"] == "ConflictException":
        print(f"Vocabulary {VOCAB_NAME} already exists. Checking state...")
    else:
        raise

while True:
    res = tr.get_vocabulary(VocabularyName=VOCAB_NAME)
    state = res["VocabularyState"]
    print(f"Current state: {state}", flush=True)
    if state == "READY":
        print("VOCABULARY IS READY!")
        break
    elif state == "FAILED":
        print(f"Reason: {res.get('FailureReason')}")
        raise SystemExit("Vocabulary creation FAILED.")
    time.sleep(6)
