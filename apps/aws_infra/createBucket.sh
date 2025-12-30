
npx cdk bootstrap --context dailySubdomain=$SUBDOMAIN --context s3bucketName=$AWS_BUCKET_NAME --context s3bucketRegion=$REGION

npx cdk deploy --context dailySubdomain=$SUBDOMAIN --context s3bucketName=$AWS_BUCKET_NAME --context s3bucketRegion=$REGION

curl --request POST \
  --url https://api.daily.co/v1/ \
  --header "Authorization: Bearer $DAILY_API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{
    "properties": {
      "recordings_bucket": {
        "bucket_name": "assessmentis-daily-recordings",
        "bucket_region": "ca-central-1",
        "assume_role_arn": "",
        "allow_api_access": true
      }
    }
  }'