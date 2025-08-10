#!/bin/bash
# Bootstrap a new AWS CDK project for ECS API infrastructure
cd $(dirname "$0")/cdk-ecs-api
npx cdk init app --language typescript
