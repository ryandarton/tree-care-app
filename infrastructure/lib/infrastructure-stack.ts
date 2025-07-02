import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { Construct } from 'constructs';
import { RemovalPolicy } from 'aws-cdk-lib';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const environment = this.node.tryGetContext('environment') || 'dev';
    const isProd = environment === 'prod';

    // Stack Tags
    cdk.Tags.of(this).add('Application', 'TreeCareApp');
    cdk.Tags.of(this).add('Environment', environment);

    // DynamoDB Tables
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `TreeCareUsers-${environment}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: isProd ? { pointInTimeRecoveryEnabled: true } : undefined,
    });

    // Add GSI for email lookup
    usersTable.addGlobalSecondaryIndex({
      indexName: 'email-index',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
    });

    const treesTable = new dynamodb.Table(this, 'TreesTable', {
      tableName: `TreeCareTrees-${environment}`,
      partitionKey: { name: 'treeId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: isProd ? { pointInTimeRecoveryEnabled: true } : undefined,
    });

    const photosTable = new dynamodb.Table(this, 'PhotosTable', {
      tableName: `TreeCarePhotos-${environment}`,
      partitionKey: { name: 'photoId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'treeId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: isProd ? { pointInTimeRecoveryEnabled: true } : undefined,
    });

    const subscriptionsTable = new dynamodb.Table(this, 'SubscriptionsTable', {
      tableName: `TreeCareSubscriptions-${environment}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      pointInTimeRecoverySpecification: isProd ? { pointInTimeRecoveryEnabled: true } : undefined,
    });

    // S3 Bucket for photo storage
    const photoBucket = new s3.Bucket(this, 'PhotoBucket', {
      bucketName: `tree-care-photos-${environment}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      autoDeleteObjects: !isProd, // Only for non-prod environments
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // Cognito User Pool
    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `TreeCareUserPool-${environment}`,
      selfSignUpEnabled: true,
      signInAliases: {
        email: true,
        username: false,
      },
      mfa: cognito.Mfa.OPTIONAL,
      mfaSecondFactor: {
        sms: true,
        otp: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
      standardAttributes: {
        email: {
          required: true,
          mutable: false,
        },
        phoneNumber: {
          required: false,
          mutable: true,
        },
      },
    });

    // User Pool Client
    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool,
      userPoolClientName: 'TreeCareMobileApp',
      authFlows: {
        userPassword: true,
        custom: false,
        userSrp: false,
      },
      generateSecret: false,
      refreshTokenValidity: cdk.Duration.days(30),
      accessTokenValidity: cdk.Duration.hours(1),
      idTokenValidity: cdk.Duration.hours(1),
    });

    // Enable contributor insights for production tables
    if (isProd) {
      const tables = [usersTable, treesTable, photosTable, subscriptionsTable];
      tables.forEach((table) => {
        const cfnTable = table.node.defaultChild as dynamodb.CfnTable;
        cfnTable.contributorInsightsSpecification = {
          enabled: true,
        };
      });
    }

    // Outputs
    new cdk.CfnOutput(this, 'UserPoolId', {
      value: userPool.userPoolId,
      exportName: `TreeCareUserPoolId-${environment}`,
    });

    new cdk.CfnOutput(this, 'UserPoolClientId', {
      value: userPoolClient.userPoolClientId,
      exportName: `TreeCareUserPoolClientId-${environment}`,
    });

    new cdk.CfnOutput(this, 'PhotoBucketName', {
      value: photoBucket.bucketName,
      exportName: `TreeCarePhotoBucket-${environment}`,
    });
  }
}
