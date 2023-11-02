import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as fs from "fs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as api from 'aws-cdk-lib/aws-apigateway';
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as dotenv from 'dotenv';
import * as expand from 'dotenv-expand';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
const env = dotenv.config();
expand.expand(env);

export class MaxoneownStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const defaultenv: { [key: string]: string } = {
      MONGODBURL: process.env.MONGODBURL || ''
    };
    const stepfunction_role = new iam.Role(this, 'VAMS3.0FunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess'));
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'));
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonAPIGatewayInvokeFullAccess'));

    const apiGatewayRole = new iam.Role(this, 'ApiGatewayRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'), // Assume the role by API Gateway
    });



    const vehicleCreateOrUpdate = new NodejsFunction(
      this,
      "vehicleCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        environment: { ...defaultenv },
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'vehicleCrud',
          'index.ts'
        ),
      }
    );
    const vehicleApiGateway = new NodejsFunction(
      this,
      "vehicleApiGateway",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        environment: { ...defaultenv },
        entry: path.join(
          __dirname,
          "/../lambda",
          'vehicleApiGateway',
          'index.ts'
        ),
      }
    );
    const vehicleSnsSubscribe = new NodejsFunction(
      this,
      "vehicleSnsKeyStore",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        environment: { ...defaultenv },
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'vehicleSnsSubscribe',
          'index.ts'
        ),
      }
    );

    const policyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['states:SendTaskSuccess', 'states:SendTaskFailure', 'states:StartExecution'],
      resources: ['*'],
    });


    const vehicleTopic = new sns.Topic(this, 'VehicleTopic', {
      displayName: 'My SNS Vehicle Topic',
      fifo: false,
      topicName: 'Vehicle'
    });

    vehicleTopic.addSubscription(new subscriptions.LambdaSubscription(vehicleSnsSubscribe));

    const file = fs.readFileSync(
      path.join(__dirname, "/../lib/steps/Vehicle.json")
    );

    const vehicleApi = new api.RestApi(this, 'VehicleApi', {
      restApiName: 'vehicle',
      description: 'Api regarding vehicle'
    });


    const lambdaintegration = new api.LambdaIntegration(vehicleApiGateway);
    const vehicleMovement = vehicleApi.root.addResource('vehicle');
    const vehicleStart = vehicleMovement.addResource('start');

    vehicleMovement.addMethod('POST', lambdaintegration);



    stepfunction_role.addToPolicy(new iam.PolicyStatement({
      actions: ['execute-api:Invoke'],
      resources: [vehicleApi.arnForExecuteApi()],
    }));

    policyStatement.addAllResources();
    vehicleCreateOrUpdate.addToRolePolicy(policyStatement);
    vehicleApiGateway.addToRolePolicy(policyStatement);


    const vams3MaxOneStateMachine = new sfn.CfnStateMachine(
      this,
      "VAMS3.1MaxOneStateMachine",
      {
        definitionString: file.toString(),
        definitionSubstitutions: {
          vehicleCreateOrUpdateArn: vehicleCreateOrUpdate.functionArn,
          vehiclecreateorupdatelambdaarn: vehicleApi.restApiId,
          vehicleTopicArn: vehicleTopic.topicArn,
        },
        roleArn: stepfunction_role.roleArn
      }
    );
    vehicleApiGateway.addEnvironment('STATE_MACHINE_ARN', vams3MaxOneStateMachine.attrArn);


    const stepFunctionsPolicy = new iam.PolicyStatement({
      actions: ['states:StartExecution'], // Define the actions you want to allow
      resources: [vams3MaxOneStateMachine.attrArn], // Replace with your Step Function's ARN
    });


    vehicleApiGateway.addToRolePolicy(
      stepFunctionsPolicy
    );
    apiGatewayRole.addToPolicy(stepFunctionsPolicy);
  }
}
