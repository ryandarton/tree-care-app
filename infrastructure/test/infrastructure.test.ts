import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as TreeCareInfrastructure from '../lib/infrastructure-stack';

describe('TreeCareInfrastructureStack', () => {
  let app: cdk.App;
  let stack: TreeCareInfrastructure.InfrastructureStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TreeCareInfrastructure.InfrastructureStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('DynamoDB Tables', () => {
    test('creates users table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TreeCareUsers'),
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'userId',
            KeyType: 'HASH'
          })
        ]),
        GlobalSecondaryIndexes: Match.arrayWith([
          Match.objectLike({
            IndexName: 'email-index',
            KeySchema: Match.arrayWith([
              Match.objectLike({
                AttributeName: 'email',
                KeyType: 'HASH'
              })
            ])
          })
        ])
      });
    });

    test('creates trees table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TreeCareTrees'),
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'treeId',
            KeyType: 'HASH'
          }),
          Match.objectLike({
            AttributeName: 'userId',
            KeyType: 'RANGE'
          })
        ])
      });
    });

    test('creates photos table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TreeCarePhotos'),
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'photoId',
            KeyType: 'HASH'
          }),
          Match.objectLike({
            AttributeName: 'treeId',
            KeyType: 'RANGE'
          })
        ])
      });
    });

    test('creates subscriptions table with correct configuration', () => {
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: Match.stringLikeRegexp('TreeCareSubscriptions'),
        BillingMode: 'PAY_PER_REQUEST',
        KeySchema: Match.arrayWith([
          Match.objectLike({
            AttributeName: 'userId',
            KeyType: 'HASH'
          })
        ])
      });
    });
  });

  describe('S3 Buckets', () => {
    test('creates photo storage bucket with lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.anyValue(),
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'delete-old-versions',
              Status: 'Enabled',
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30
              }
            }),
            Match.objectLike({
              Id: 'transition-to-ia',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 90
                })
              ])
            })
          ])
        }
      });
    });

    test('photo bucket has encryption enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      });
    });

    test('photo bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });
  });

  describe('Cognito User Pool', () => {
    test('creates user pool with MFA configuration', () => {
      template.hasResourceProperties('AWS::Cognito::UserPool', {
        UserPoolName: Match.stringLikeRegexp('TreeCareUserPool'),
        MfaConfiguration: 'OPTIONAL',
        EnabledMfas: Match.arrayWith(['SMS_MFA', 'SOFTWARE_TOKEN_MFA']),
        Schema: Match.arrayWith([
          Match.objectLike({
            Name: 'email',
            Required: true,
            Mutable: false
          }),
          Match.objectLike({
            Name: 'phone_number',
            Required: false,
            Mutable: true
          })
        ])
      });
    });

    test('creates user pool client', () => {
      template.hasResourceProperties('AWS::Cognito::UserPoolClient', {
        ClientName: 'TreeCareMobileApp',
        ExplicitAuthFlows: Match.arrayWith([
          'ALLOW_USER_PASSWORD_AUTH',
          'ALLOW_REFRESH_TOKEN_AUTH'
        ]),
        GenerateSecret: false
      });
    });
  });

  describe('Stack Configuration', () => {
    test('has correct stack tags', () => {
      const stackTags = stack.tags.tagValues();
      expect(stackTags).toMatchObject({
        Application: 'TreeCareApp',
        Environment: expect.stringMatching(/dev|staging|prod/)
      });
    });

    test('outputs are exported correctly', () => {
      template.hasOutput('UserPoolId', {
        Export: {
          Name: Match.stringLikeRegexp('TreeCareUserPoolId')
        }
      });

      template.hasOutput('PhotoBucketName', {
        Export: {
          Name: Match.stringLikeRegexp('TreeCarePhotoBucket')
        }
      });
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('dev environment uses DESTROY removal policy', () => {
      const devApp = new cdk.App({ context: { environment: 'dev' } });
      const devStack = new TreeCareInfrastructure.InfrastructureStack(devApp, 'DevStack');
      const devTemplate = Template.fromStack(devStack);

      // Check DynamoDB tables have DESTROY policy
      devTemplate.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Delete',
        DeletionPolicy: 'Delete'
      });

      // Check S3 bucket has auto-delete objects
      devTemplate.hasResource('Custom::S3AutoDeleteObjects', {
        Type: 'Custom::S3AutoDeleteObjects'
      });
    });

    test('staging environment has different table names', () => {
      const stagingApp = new cdk.App({ context: { environment: 'staging' } });
      const stagingStack = new TreeCareInfrastructure.InfrastructureStack(stagingApp, 'StagingStack');
      const stagingTemplate = Template.fromStack(stagingStack);

      stagingTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TreeCareUsers-staging'
      });

      stagingTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        TableName: 'TreeCareTrees-staging'
      });
    });

    test('prod environment has RETAIN removal policy', () => {
      const prodApp = new cdk.App({ context: { environment: 'prod' } });
      const prodStack = new TreeCareInfrastructure.InfrastructureStack(prodApp, 'ProdStack');
      const prodTemplate = Template.fromStack(prodStack);

      // Check DynamoDB tables have RETAIN policy
      prodTemplate.hasResource('AWS::DynamoDB::Table', {
        UpdateReplacePolicy: 'Retain',
        DeletionPolicy: 'Retain'
      });
    });

    test('prod environment has backup configuration', () => {
      const prodApp = new cdk.App({ context: { environment: 'prod' } });
      const prodStack = new TreeCareInfrastructure.InfrastructureStack(prodApp, 'ProdStack');
      const prodTemplate = Template.fromStack(prodStack);

      // Check DynamoDB tables have point-in-time recovery
      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: true
        }
      });
    });

    test('prod environment has enhanced monitoring', () => {
      const prodApp = new cdk.App({ context: { environment: 'prod' } });
      const prodStack = new TreeCareInfrastructure.InfrastructureStack(prodApp, 'ProdStack');
      const prodTemplate = Template.fromStack(prodStack);

      // Check DynamoDB tables have contributor insights
      prodTemplate.hasResourceProperties('AWS::DynamoDB::Table', {
        ContributorInsightsSpecification: {
          Enabled: true
        }
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates Lambda execution role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        }
      });
    });

    test('Lambda role has DynamoDB permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'dynamodb:GetItem',
                'dynamodb:PutItem',
                'dynamodb:UpdateItem',
                'dynamodb:DeleteItem',
                'dynamodb:Query',
                'dynamodb:Scan'
              ])
            })
          ])
        }
      });
    });

    test('Lambda role has S3 permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject'
              ])
            })
          ])
        }
      });
    });

    test('Lambda role has CloudWatch Logs permissions', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents'
              ])
            })
          ])
        }
      });
    });

    test('S3 bucket has secure bucket policy', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: {
                AWS: '*'
              },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        }
      });
    });
  });
});
