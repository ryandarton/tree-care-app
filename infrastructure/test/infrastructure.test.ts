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
});
