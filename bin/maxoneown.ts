#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { MaxoneownStack } from '../lib/maxoneown-stack';

const app = new cdk.App();
new MaxoneownStack(app, 'MaxoneownStack1');
