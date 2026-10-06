import boto3

r = 'ap-south-1'
ec2 = boto3.client('ec2', region_name=r)
s3 = boto3.client('s3', region_name=r)
ddb = boto3.client('dynamodb', region_name=r)
lam = boto3.client('lambda', region_name=r)
ev = boto3.client('events', region_name=r)
tr = boto3.client('transcribe', region_name=r)

insts = [(i['InstanceId'], i['State']['Name'], i.get('PublicIpAddress'), i.get('InstanceType')) for res in ec2.describe_instances()['Reservations'] for i in res['Instances']]
print('EC2 Instances:', insts)

tables = ddb.list_tables()['TableNames']
print('DynamoDB Tables:', tables)

try:
    voc = tr.get_vocabulary(VocabularyName='eng-math-vocab')
    print('Transcribe Vocab:', voc['VocabularyName'], voc['VocabularyState'])
except Exception as e:
    print('Transcribe Vocab:', e)

fns = [f['FunctionName'] for f in lam.list_functions()['Functions']]
print('Lambda Functions:', fns)

rules = [r['Name'] for r in ev.list_rules()['Rules']]
print('EventBridge Rules:', rules)

buckets = [b['Name'] for b in s3.list_buckets()['Buckets'] if 'speechlekha' in b['Name']]
print('S3 Buckets:', buckets)

