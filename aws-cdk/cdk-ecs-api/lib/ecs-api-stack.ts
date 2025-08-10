import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';

export class EcsApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for PDF uploads
    const pdfBucket = new s3.Bucket(this, 'PdfUploadBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY, // NOT for production
      autoDeleteObjects: true, // NOT for production
      cors: [{
        allowedMethods: [s3.HttpMethods.PUT, s3.HttpMethods.POST, s3.HttpMethods.GET],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
      }],
    });

    // VPC (single AZ, smallest possible)
    const vpc = new ec2.Vpc(this, 'ApiVpc', {
      maxAzs: 1,
      natGateways: 0, // No NAT, public only
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'ApiCluster', {
      vpc,
    });

    // Task Role for ECS to access S3
    const taskRole = new iam.Role(this, 'ApiTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    pdfBucket.grantReadWrite(taskRole);

    // Fargate Service (minimal, placeholder image)
    const fargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'ApiFargateService', {
      cluster,
      cpu: 256, // Smallest allowed by CDK for ALB Fargate
      memoryLimitMiB: 512, // Smallest allowed by CDK for ALB Fargate
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'), // Replace with your API image
        containerPort: 80,
        taskRole: taskRole,
        environment: {
          BUCKET_NAME: pdfBucket.bucketName,
        },
      },
      publicLoadBalancer: true,
      assignPublicIp: true, // Ensure public access
    });
  }
}
