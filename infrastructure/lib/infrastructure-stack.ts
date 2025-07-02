import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
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

    // IAM Roles & Policies
    // Lambda Execution Role
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      roleName: `TreeCareLambdaRole-${environment}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Execution role for Tree Care Lambda functions',
    });

    // CloudWatch Logs permissions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [`arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`],
    }));

    // DynamoDB permissions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'dynamodb:GetItem',
        'dynamodb:PutItem',
        'dynamodb:UpdateItem',
        'dynamodb:DeleteItem',
        'dynamodb:Query',
        'dynamodb:Scan',
        'dynamodb:BatchGetItem',
        'dynamodb:BatchWriteItem',
      ],
      resources: [
        usersTable.tableArn,
        treesTable.tableArn,
        photosTable.tableArn,
        subscriptionsTable.tableArn,
        `${usersTable.tableArn}/index/*`,
        `${treesTable.tableArn}/index/*`,
        `${photosTable.tableArn}/index/*`,
      ],
    }));

    // S3 permissions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObjectVersion',
      ],
      resources: [`${photoBucket.bucketArn}/*`],
    }));

    // S3 bucket permissions (list, etc.)
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:ListBucket',
        's3:GetBucketLocation',
      ],
      resources: [photoBucket.bucketArn],
    }));

    // Cognito permissions
    lambdaExecutionRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cognito-idp:AdminGetUser',
        'cognito-idp:AdminUpdateUserAttributes',
        'cognito-idp:AdminConfirmSignUp',
        'cognito-idp:AdminSetUserPassword',
      ],
      resources: [userPool.userPoolArn],
    }));

    // S3 Bucket Policy - Enforce SSL/TLS
    photoBucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [
        photoBucket.bucketArn,
        `${photoBucket.bucketArn}/*`,
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    }));

    // API Gateway
    const api = new apigateway.RestApi(this, 'TreeCareAPI', {
      restApiName: `TreeCareAPI-${environment}`,
      description: 'Tree Care App API Gateway',
      deployOptions: {
        stageName: environment,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,
        accessLogDestination: new apigateway.LogGroupLogDestination(
          new logs.LogGroup(this, 'ApiGatewayLogGroup', {
            logGroupName: `/aws/apigateway/TreeCareAPI-${environment}`,
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: isProd ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY,
          })
        ),
        accessLogFormat: apigateway.AccessLogFormat.jsonWithStandardFields(),
        throttlingBurstLimit: 5000,
        throttlingRateLimit: 2000,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Amz-Security-Token'],
        maxAge: cdk.Duration.days(1),
      },
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            principals: [new iam.AnyPrincipal()],
            actions: ['execute-api:Invoke'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Request Validators
    new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      requestValidatorName: `TreeCareRequestValidator-${environment}`,
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    // Models for request validation
    new apigateway.Model(this, 'TreeModel', {
      restApi: api,
      modelName: 'TreeModel',
      contentType: 'application/json',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['treeId'],
        properties: {
          treeId: { type: apigateway.JsonSchemaType.STRING },
          species: { type: apigateway.JsonSchemaType.STRING },
          location: {
            type: apigateway.JsonSchemaType.OBJECT,
            properties: {
              lat: { type: apigateway.JsonSchemaType.NUMBER },
              lng: { type: apigateway.JsonSchemaType.NUMBER },
            },
          },
        },
      },
    });

    // Custom Gateway Responses
    api.addGatewayResponse('Default4XX', {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
      templates: {
        'application/json': '{"error": "$context.error.message", "requestId": "$context.requestId"}',
      },
    });

    api.addGatewayResponse('Default5XX', {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
      },
      templates: {
        'application/json': '{"error": "Internal server error", "requestId": "$context.requestId"}',
      },
    });

    // Usage Plans
    // Free tier usage plan
    const freeUsagePlan = new apigateway.UsagePlan(this, 'FreeUsagePlan', {
      name: `TreeCareFreeUsagePlan-${environment}`,
      description: 'Usage plan for free tier users',
      throttle: {
        burstLimit: 1000,
        rateLimit: 100,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.MONTH,
      },
    });

    // Premium tier usage plan
    const premiumUsagePlan = new apigateway.UsagePlan(this, 'PremiumUsagePlan', {
      name: `TreeCarePremiumUsagePlan-${environment}`,
      description: 'Usage plan for premium tier users',
      throttle: {
        burstLimit: 10000,
        rateLimit: 5000,
      },
      quota: {
        limit: 10000000,
        period: apigateway.Period.MONTH,
      },
    });

    // API Keys
    const freeApiKey = new apigateway.ApiKey(this, 'FreeApiKey', {
      apiKeyName: `TreeCareFreeKey-${environment}`,
      description: 'API key for free tier users',
      enabled: true,
    });

    const premiumApiKey = new apigateway.ApiKey(this, 'PremiumApiKey', {
      apiKeyName: `TreeCarePremiumKey-${environment}`,
      description: 'API key for premium tier users',
      enabled: true,
    });

    // Associate API keys with usage plans
    freeUsagePlan.addApiKey(freeApiKey);
    premiumUsagePlan.addApiKey(premiumApiKey);

    // Add API stages to usage plans
    freeUsagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    premiumUsagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Default usage plan (no API key required)
    const defaultUsagePlan = new apigateway.UsagePlan(this, 'DefaultUsagePlan', {
      name: `TreeCareUsagePlan-${environment}`,
      description: 'Usage plan for Tree Care API',
      throttle: {
        burstLimit: 5000,
        rateLimit: 2000,
      },
      quota: {
        limit: 1000000,
        period: apigateway.Period.MONTH,
      },
    });

    defaultUsagePlan.addApiStage({
      stage: api.deploymentStage,
    });

    // Tag the API stage for WAF
    cdk.Tags.of(api.deploymentStage).add('WAF', 'Enabled');

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

    new cdk.CfnOutput(this, 'LambdaExecutionRoleArn', {
      value: lambdaExecutionRole.roleArn,
      exportName: `TreeCareLambdaRole-${environment}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      exportName: `TreeCareApiUrl-${environment}`,
    });

    new cdk.CfnOutput(this, 'ApiGatewayRestApiId', {
      value: api.restApiId,
      exportName: `TreeCareApiId-${environment}`,
    });
  }
}
