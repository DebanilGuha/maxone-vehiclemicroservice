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
const env= dotenv.config();
expand.expand(env);

export class MaxoneownStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    const defaultenv : {[key:string]: string}= {
      MONGODBURL: process.env.MONGODBURL || ''
    };
    const stepfunction_role = new iam.Role(this, 'VAMS3.0FunctionsRole', {
      assumedBy: new iam.ServicePrincipal('states.amazonaws.com'),
    });
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSLambda_FullAccess'));
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AWSStepFunctionsFullAccess'));
    stepfunction_role.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSNSFullAccess'));

    const newCreateOrUpdate = new NodejsFunction(
      this,
      "newCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        memorySize : 2048,
        environment: {...defaultenv},
        entry: path.join(
          __dirname,
          "/../lambda",
          'newCreateOrUpdate',
          'index.ts'
        ),
      }
    );
    
    const inboundCreateOrUpdate = new NodejsFunction(
      this,
      "inboundCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        environment: {...defaultenv},
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'inboundCreateOrUpdate',
          'index.ts'
        ),
      }
    );
    const championCreateOrUpdate = new NodejsFunction(
      this,
      "championCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'championCreateOrUpdate',
          'index.ts'
        ),
      }
    );
    const contractCreateOrUpdate = new NodejsFunction(
      this,
      "contractCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'contractCreateOrUpdate',
          'index.ts'
        ),
      }
    );

      //Movement Data
    const movement = new NodejsFunction(
      this,
      "movement",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        entry: path.join(
          __dirname,
          "/../lambda",
          'movement',
          'index.ts'
        ),
      }
    );
    const pickUpVehicle = new NodejsFunction(
      this,
      "pickUpVehicle",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        entry: path.join(
          __dirname,
          "/../lambda",
          'pickUpVehicle',
          'index.ts'
        ),
      }
    );


    const readyForActivationCreateOrUpdate = new NodejsFunction(
      this,
      "readyForActivationCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'readyForActivationCreateOrUpdate',
          'index.ts'
        ),
      }
    );

    const receiveToken = new NodejsFunction(
      this,
      "receiveToken",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.minutes(5),
        memorySize : 2048,
        environment:{
          STATE_MACHINE_ARN:'',
          ...defaultenv
        },
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'receiveToken',
          'index.ts'
        ),
      }
    );

    //Champion to Get Token
    const championReceiveToken = new NodejsFunction(
      this,
      "championReceiveToken",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.minutes(5),
        memorySize : 2048,
        environment:{
          STATE_MACHINE_ARN:'',
          ...defaultenv
        },
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
        entry: path.join(
          __dirname,
          "/../lambda",
          'championReceiveToken',
          'index.ts'
        ),
      }
    );


    const activateVehicle = new NodejsFunction(
      this,
      "activateVehicle",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(15),
        handler:'handler',
        environment: {...defaultenv},
        entry: path.join(
          __dirname,
          "/../lambda",
          'activateVehicle',
          'index.ts'
        ),
      }
    );
    receiveToken.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
      resources: ['*'],
      }));

    championReceiveToken.addToRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['states:SendTaskSuccess', 'states:SendTaskFailure'],
      resources: ['*'],
      }));

      

    const vehicleTopic = new sns.Topic(this, 'VehicleTopic', {
      displayName: 'My SNS Vehicle Topic',
      fifo: false,
      topicName: 'Vehicle1'
    });
    
    const championTopic = new sns.Topic(this, 'ChampionTopic', {
      displayName: 'My SNS Vehicle Topic',
      fifo: false,
      topicName: 'Champion1'
    });

    vehicleTopic.addSubscription(new subscriptions.LambdaSubscription(receiveToken));
    championTopic.addSubscription(new subscriptions.LambdaSubscription(championReceiveToken));



    const file: any = fs.readFileSync(
      path.join(__dirname, "/../lib/steps/Vehicle.json")
    );

    const movementapiFunction = new NodejsFunction(
      this,
      "movementapiFunction",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        environment: {...defaultenv},
        entry: path.join(
          __dirname,
          "/../lambda",
          'movementapiFunction',
          'index.ts'
        ),
      }
    );

    const movementApi = new api.RestApi(this,'MovementApi',{
      restApiName:'movement',
      description:'Api regarding movement'
    });
    const lambdaintegration = new api.LambdaIntegration(movementapiFunction);
    movementApi.root.addMethod('POST',lambdaintegration);


    const vams3MaxOneStateMachine = new sfn.CfnStateMachine(
      this,
      "VAMS3.0MaxOneStateMachine",
      {
        definitionString: file.toString(),
        definitionSubstitutions: {
          newFunctionArn: newCreateOrUpdate.functionArn,
          inboundFunctionArn: inboundCreateOrUpdate.functionArn,
          vehicleArn: vehicleTopic.topicArn,
          championArn: championTopic.topicArn,
          activateVehicle: activateVehicle.functionArn,
          readyForActivationArn: readyForActivationCreateOrUpdate.functionArn,
          championCreateOrUpdateArn:championCreateOrUpdate.functionArn,
          contractCreateOrUpdateArn: contractCreateOrUpdate.functionArn,
          movementArn:movement.functionArn,
          pickUpVehicleArn: pickUpVehicle.functionArn,
          apiurlarn: movementApi.url
        },
        roleArn: stepfunction_role.roleArn
      }
    );
    receiveToken.addToRolePolicy(
      new iam.PolicyStatement({
      actions: ['states:StartExecution'],
      resources: [vams3MaxOneStateMachine.attrArn],
      })
      );
    receiveToken.addEnvironment('STATE_MACHINE_ARN',vams3MaxOneStateMachine.attrArn);
    
  }
}
