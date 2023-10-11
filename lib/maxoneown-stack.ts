import { Duration, Stack, StackProps } from 'aws-cdk-lib';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as fs from "fs";
import * as sfn from "aws-cdk-lib/aws-stepfunctions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as path from "path";
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';


export class MaxoneownStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

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
        timeout: Duration.seconds(5),
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
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
        timeout: Duration.seconds(5),
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
    const readyForActivationCreateOrUpdate = new NodejsFunction(
      this,
      "readyForActivationCreateOrUpdate",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
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
        timeout: Duration.seconds(5),
        environment:{
          STATE_MACHINE_ARN:''
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
    const activateVehicle = new NodejsFunction(
      this,
      "activateVehicle",
      {
        runtime: lambda.Runtime.NODEJS_18_X,
        timeout: Duration.seconds(5),
        handler:'handler',
        bundling: {
          nodeModules: ["mongodb", "ajv", "aws-sdk"],
          minify: true,
        },
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

      

    const vehicleTopic = new sns.Topic(this, 'VehicleTopic', {
      displayName: 'My SNS Vehicle Topic',
      fifo: false,
      topicName: 'Vehicle'
    });

    vehicleTopic.addSubscription(new subscriptions.LambdaSubscription(receiveToken));



    const file: any = fs.readFileSync(
      path.join(__dirname, "/../lib/steps/Vehicle.json")
    );


    const vams3MaxOneStateMachine = new sfn.CfnStateMachine(
      this,
      "VAMS3MaxOneStateMachine",
      {
        definitionString: file.toString(),
        definitionSubstitutions: {
          newFunctionArn: newCreateOrUpdate.functionArn,
          inboundFunctionArn: inboundCreateOrUpdate.functionArn,
          vehicleArn: vehicleTopic.topicArn,
          activateVehicle: activateVehicle.functionArn,
          readyForActivationArn: readyForActivationCreateOrUpdate.functionArn
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
