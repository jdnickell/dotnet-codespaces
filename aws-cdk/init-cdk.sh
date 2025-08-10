#!/bin/bash
# Bootstrap script to initialize a new AWS CDK project in TypeScript
cd $(dirname "$0")
npx cdk init app --language typescript
