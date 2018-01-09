## From SAM to AWS - "script"

In this session you will learn the basis of Serverless and the starting set for every developer. We will go through all the steps from local development to continuous delivery using our favourite AWS Serverless Services.

### Step 1: What is Serverless?

In this part of the presentation, if the customers know what is serverless, let's talk about their workloads. **What are they doing/planning to do with Serverless?**

Pysical Servers -> Virtual Machines -> Containers -> **Serverless**

Serverless computing allows you to build and run applications and services without thinking about servers. Serverless applications don't require you to provision, scale, and manage any servers. You can build them for virtually any type of application or backend service, and everything required to run and scale your application with high availability is handled for you.

Building serverless applications means that your developers can focus on their core product instead of worrying about managing and operating servers or runtimes, either in the cloud or on-premises. This reduced overhead lets developers reclaim time and energy that can be spent on developing great products which scale and that are reliable.

- Functions as the unit of scale
- Explain Serveless Paradigm is change of mindset.
- Serverless is still growing.

### Step 2: Services we are going to use:
#### Step 2.1: AWS Lambda

AWS Lambda is a compute service that lets you run code without provisioning or managing servers. 

- Runs on Amazon Handled Container.
- Languages we support
- AWS Lambda Ensures function is executed in parallel and at scale

**Key knowledge bulletpoints:**

- Your code
 - Lamda handler
 - Uploading code vs. the widget.
- The trigger
- Execution Role
- Enviromental Variables
- Timeout
- Memory
- VPC
- DLQ for failed requests

#### Step 2.2: Api Gateway

Amazon API Gateway is a fully managed service that makes it easy for developers to create, publish, maintain, monitor, and secure APIs at any scale.

1. Create a unified API frontend fro multiple microservices
2. DDoS protection and throttling for backend systems
3. Authenticate and authorize requests.
4. Integration with Lambda.
5. Change the payload.
6. Custom error codes - Abstract the app layer from the API
7. Swagger compatible

#### Step 2.3: SAM - Serverless Application Model

SAM is an abstraction on CloudFormation

- New resource types AWS::Serverless::*
- Transformed to standard CloudFormation as a ChangeSet
- You can mix standard CloudFormation and Serverless resources in the same template
 
SAM makes easier to create applications!

sam validate - validates a Serverless SAM template
sam package - aws cloudformation package
sam deploy - aws cloudformation deploy

#### Step 2.4: SAM Local

Let's start from the begining! Local development.
SAM Local can be used to test functions locally, start a local API Gateway from a SAM template, validate a SAM template, and generate sample payloads for various event sources.

### Step 3: Install SAM Local
 - https://github.com/awslabs/aws-sam-local
 - Introduce Visual Studio Code as we are going to use it for this session.
### Step 4: SAM Local

**Invoking function with event file:**

`sam local invoke "Ratings" -e event.json`

**Generate sample event source payloads**

`sam local generate-event <service>`
`sam local generate-event "S3" | sam local invoke "Ratings"`
**Run API Gateway locally**

`sam local start-api`

**Debug your Lambda**
Set your configuration on Visual Studio Code:

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Attach to SAM Local",
            "type": "node",
            "request": "attach",
            "address": "localhost",
            "port": 5858,
            "localRoot": "${workspaceRoot}/(you-function)",
            "remoteRoot": "/var/task"
        }
    ]
}
```
Invoke the Lamda to debug

```
sam local invoke -d 5858 <function logical id>
sam local start-api -d 5858
```

### Step 5: Preparing for the pipeline!
#### Step 5.1: Create S3 Bucket for deployments.

Create an S3 bucket where your deployments are going to be uploaded. Use a name such as:

```Javascript
my-deployments-<your-alias-here>
```
#### Step 5.2: Create a CodeCommit repository.

1. Go to the CodeCommit repository and click on **Create Repository**
2. Enter a repository name such as **ServerlessOps_Repository**
3. Skip Configure email notifications' step.
4. Follow the steps provided by CodeCommit to **Connect to your repository**
5. Copy the content of the folder **ServerlessOps_workshop** to the recently created **ServerlessOps_Repository**
6. Run these commands to perform the inital commit:

````BASH
git add -A
git commit -m "initial commit"
git push
````
Now your code is CodeCommit and you start building your pipeline.

##### Note: The *yaml* template - SAM!

The folder with the code has the following tree:

	├── README.md
	├── buildspec.yml
	├── documentation
	│   ├── SAM.pptx
	│   ├── from-sam-to-aws.md
	│   └── images
	│       └── ...
	├── frontend
	│   ├── assets
	│   │   └── ...
	│   ├── front-js
	│   │   └── **assets.js**
	│   ├── index.html
	│   └── someguy.jpg
	├── functions
	│   ├── **getinfo**
	│   │   └── **index.js**
	│   └── **getinfoenhanced**
	│       └── **index.js**
	├── **swagger.yaml**
	├── template-local.yaml
	├── **template.yaml**
	└── tests
	    └── ...

The important files here are represented by *name of the file *.

The SAM template is called **template.yaml** and has two resources:
1. An API
2. A function

The function has an API method defined in the API as the event trigger. This method is define in the file **swagger.yaml** as well as some other features such as CORS.


### Step 5.3: Creating the pipeline with CodePipeline

1. Go to the CodePipeline console and click on **Get Started**
2. Create a Pipeline with the name **ServerlessOps_pipeline** and click on next step.

<img src="documentation/images/codepipeline1.png" width="60%"/>

3. Drop down the service provider and select **CodeCommit**.
4. Look for the repository name created previously and select it.
5. Select the Branch name **master**.

<img src="documentation/images/codepipeline2.png" width="60%"/>

#### Step 5.4: How to use CodeBuild for your serveless pipeline - *build.yaml*

Here we are going to select the build provider. In this case, we will use CodeBuild.

Explain the file build.yaml.

*Review role permissions.*

<img src="documentation/images/codepipeline3.png" width="60%"/>

CodeBuild Role:

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:logs:us-east-1:012345678901:log-group:/aws/codebuild/from-sam-to-aws",
                "arn:aws:logs:us-east-1:012345678901:log-group:/aws/codebuild/from-sam-to-aws:*"
            ],
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ]
        },
        {
            "Effect": "Allow",
            "Resource": [
                "arn:aws:s3:::codepipeline-us-east-1-*"
            ],
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:GetObjectVersion"
            ]
        },
        {
            "Effect": "Allow",
            "Action": "s3:*",
            "Resource": "arn:aws:s3::012345678901:nameofyourbucket"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ssm:GetParameters"
            ],
            "Resource": "arn:aws:ssm:us-east-1:012345678901:parameter/CodeBuild/*"
        }
    ]
}
```

#### Step 5.5: Deploy using CloudFormation

<img src="documentation/images/codepipeline4.png" width="60%"/>

AWS Service Role - review this

### Step 6: Update your code to force a release!

### Step 7: What about CodeStar?

#### Step 7.1: Start a project

<img src="documentation/images/codestar1.png" width="60%"/>
<img src="documentation/images/codestar2.png" width="60%"/>

Create user.

Wait for Codestar to deploy everything. All this workshop is already done by default.

## Annotations:

- MacOSX -> SSH instead of HTTPs to git (CodeCommit)
- Add CodeBuild permissions -> S3.
- Execute ChangeSet in CloudFormation or create a new stage in the codepipeline to automatically execute i
- Add photos to a S3 bucket (they are read by querystring)
- use postman to show the behavior
- Show codestart at the end (basically, it does everything for you).

## Path

How to develop in Serverless:

1. What is Serverless
1. What is Lambda
1. What is API Gateway
1. What is SAM
1. What is SAM Local
1. Code* Services
1. Build CI/CD
1. Test our CI/CD
1. CodeStar