import { CfnOutput, Duration, Stack, aws_iam, aws_s3 } from 'aws-cdk-lib'
import type { StackProps } from 'aws-cdk-lib'
import type { Construct } from 'constructs'

export class DailyRecordingBucket extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props)

    const bucketName = this.node.tryGetContext('s3bucketName')

    const recordingsBucket = new aws_s3.Bucket(this, 'DailyS3Bucket', {
      bucketName: bucketName,
      encryption: aws_s3.BucketEncryption.S3_MANAGED,
      versioned: true,
    })

    const dailySubdomain = this.node.tryGetContext('dailySubdomain')

    const dailyRole = new aws_iam.Role(this, 'dailyRole', {
      assumedBy: new aws_iam.AccountPrincipal('291871421005'),
      description: 'Role allowing Daily to record to bucket',
      externalIds: [dailySubdomain],
      maxSessionDuration: Duration.hours(12),
    })

    dailyRole.addToPolicy(
      new aws_iam.PolicyStatement({
        effect: aws_iam.Effect.ALLOW,
        actions: [
          's3:PutObject',
          's3:GetObject',
          's3:ListBucketMultipartUploads',
          's3:AbortMultipartUpload',
          's3:ListBucketVersions',
          's3:ListBucket',
          's3:GetObjectVersion',
          's3:ListMultipartUploadParts',
        ],
        // Connects the bucket to the role
        resources: [recordingsBucket.bucketArn, recordingsBucket.arnForObjects('*')],
      })
    )

    // Outputs are defined below:
    new CfnOutput(this, 'bucketName', {
      description: 'Name of S3 bucket',
      exportName: `${dailySubdomain}-bucketName`,
      value: recordingsBucket.bucketName,
    })

    new CfnOutput(this, 'bucketRegion', {
      description: 'Region where S3 bucket is located',
      exportName: `${dailySubdomain}-bucketRegion`,
      value: this.region,
    })

    new CfnOutput(this, 'roleArn', {
      description: 'ARN of IAM role for Daily to assume',
      exportName: `${dailySubdomain}-roleArn`,
      value: dailyRole.roleArn,
    })
  }
}
