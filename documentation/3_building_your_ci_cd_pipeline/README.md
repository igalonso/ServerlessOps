# 3. Building your CI/CD pipeline
## 3.1. Set up your repository with CodeCommit.

### 3.1.1: Create IAM git credentials - SSH

Now, we have our deployment ready to go. To start building our pipeline, we need to create keys to our IAM user to be able to push/pull code from CodeCommit (our respository). Continue this guide to create these keys.

### 3.1.1.1: SSH and Linux, macOS, or Unix: Set Up the Public and Private Keys for Git and AWS CodeCommit

From the terminal on your local machine, run the ssh-keygen command, and follow the directions to save the file to the .ssh directory for your profile.

For example:

```bash
$ ssh-keygen

Generating public/private rsa key pair.
Enter file in which to save the key (/home/user-name/.ssh/id_rsa): Type /home/your-user-name/.ssh/ and a file name here, for example /home/your-user-name/.ssh/codecommit_rsa

Enter passphrase (empty for no passphrase): <Type a passphrase, and then press Enter>
Enter same passphrase again: <Type the passphrase again, and then press Enter>

Your identification has been saved in /home/user-name/.ssh/codecommit_rsa.
Your public key has been saved in /home/user-name/.ssh/codecommit_rsa.pub.
The key fingerprint is:
45:63:d5:99:0e:99:73:50:5e:d4:b3:2d:86:4a:2c:14 user-name@client-name
The key's randomart image is:
+--[ RSA 2048]----+
|        E.+.o*.++|
|        .o .=.=o.|
|       . ..  *. +|
|        ..o . +..|
|        So . . . |
|          .      |
|                 |
|                 |
|                 |
+-----------------+

```

This generates:

- The codecommit_rsa file, which is the private key file.
- The codecommit_rsa.pub file, which is the public key file.

Run the following command to display the value of the public key file (codecommit_rsa.pub):

```bash
cat ~/.ssh/codecommit_rsa.pub
```

Now, you need to upload it to your IAM user Git credentials:

1. Go to the IAM Console > Users > your user.
2. If you go to the bottom of the settings, you should see something like this:

<img src="../images/iam_codecommit_credentials_ssh.png" />

Select Upload SSH public key with the content displayed in previous steps:

<img src="../images/iam_codecommit_public_key.png" width="70%"/>

Upload it.

### Step 3.1.2: Create a CodeCommit repository.

1. Go to the CodeCommit repository and click on **Create Repository**

<img src="../images/codecommit_create_repository.png" width="70%" />

2. Enter a repository name such as ```ServerlessOps_Repository```
3. Skip Configure email notifications' step.
4. Follow the steps provided by CodeCommit to **Connect to your repository**

<img src="../images/codecommit_connect_instructions.png" />

By now, you should have a folder called **ServerlessOps-repository**.

1. Copy the content of the folder **ServerlessOps_workshop** to the recently created **ServerlessOps_Repository**
<img src="../images/codecommit_copy_content.png" />
2. Run these commands to perform the inital commit:

````bash
cd ServerlessOps-repository
git add -A
git commit -m "initial commit"
git push
````
Go to the **CodeCommit** console to verify that the content has been added.

Now, let's try the application. Go to the public bucket url and test it.

## 3.2. Set up your pipeline with CodePipeline.

Now we are going to create our first pipeline! 

1. Go to the CodePipeline console and click on **Get Started**
2. Create a Pipeline with the name ```ServerlessOps_pipeline``` and click on next step.

<img src="../images/codepipeline1.png" />

### Step 3.2.1 Create the source of your pipeline.

3. Drop down the service provider and select **CodeCommit**.
4. Look for the repository name created previously and select it.
5. Select the Branch name **master**.

<img src="../images/codepipeline2.png" />

After defining our source, we will chose **CodeBuild** as our build provider. Click on Next Step.

### Step 3.2.2: How to create a CodeBuild project for your serveless pipeline

Here we are going to select the build provider. In this case, we will use CodeBuild.

In the phase of creating a build project, we select "Create a new build project".

Within the project, the file buildspec.yml has the information necesary for your deployments. If we inspect this file, we will find that the deployment generages a file calles SAM-template.yaml which replaces the "local code" with a file within the S3 bucket previously provided.

1. Name it as ```ServerlessOps_build```.
2. Select ```Use an image managed by AWs CodeBuild```.
3. Chose ```Ubuntu``` as the Operating system.
4. Select ```Node.js``` as the runtime.
5. Select Version ```4.3.2```.
3. Select ```Chose an existing service role from your account``` and, on that dropdown, select ```ServerlessOps-codebuildrole```. We will review it after creating the pipeline.
4. Click on *Save build project*

<img src="../images/codepipeline3.png" />

### Step 3.2.3: Select the deploy phase using CloudFormation.

Click on *Next Step* once you have created your build project. Altough SAM (behind the scenes) will use CodeDeploy, SAM is based in CloudFormation and the deploy will do it as well.

1. Select ```CloudFormation``` as the deployment provider.
2. Chose ```Change or replace a change set``` as the Action Mode.
3. Name the Stack ```ServerlessOps-stack```
4. Name the Change set as ```ServerlessOps-changeset```
5. The template file that CodeBuild generates is ```SAM-template.yaml```. Set it under Template file.
6. Select Capabilities ```CAPABILITIES_IAM```
7. Select the role created in *step 1* called ```ServerlessOps-cloudformationrole```.
8. Click *Next Step*.
9. In this AWS Service Role, CodePipeline should have permissions to add new stacks to *CloudFormation*, pull code from *CodeCommit*... If you don't have it, click on *Create role* and follow the steps mentioned after it.
9. Review the configuration and create the pipeline.
<img src="../images/codepipeline4.png" />


## 3.4. Modify your pipeline: add a ChangeSet execution Automation.

Go to the **CodePipeline** console and take a look at all the stages flowing. This might take a while but worth seeing!

After everything is in green, did it work? Have you deployed a new API? Seems like you haven't!

You need to go to CloudFormation and Execute the ChangeSet.

1. Select the stack *ServerlessOps-stack*. On the down panel, click on *Change sets*. 
2. Click on the Change Set called *ServerlessOps-changeset*.
2. On the new page, click on *Execute*. Accept the warning by clicking again, *Execute*.

<img src="../images/cloudformation-execute.png" />

But... This isn't pretty automatic, right? Sometimes, we might want to review all the change set before we proceed but, in this case, we want to have it all automated. To achieve it, let's add a new step to our pipeline!

1. Go to the *CodePipeline* console.
2. Select *ServelessOps_pipeline* and click *Edit*.
3. Under the stage *Staging*, click on the pen icon:
<img src="../images/codepipeline-staging-changeset.png" />
4. Click on Action and, in the new panel, add *Action category* as ```Deploy```.
5. Action name, call it ```ExecuteChangeSet```.
6. Under *Deployment provider*, select *AWS CloudFormation*.
7. Then, a new panel for CloudFormation will appear. Select Action mode *Execute a change set*, Stack name ```ServerlessOps-stack```and Change set name, ```ServerlessOps-changeset```.
8. Click on *Add action*.
9. On top of the page, click *Save pipeline changes*.
<img src="../images/codepipeline-staging-changeset-2.png" />

Your pipeline should look like this:

<img src="../images/codepipeline-staging-changeset-3.png" />



## 3.5. Try again to  push to you pipeline.

Now we have our pipeline out. Shall we start with our first deployment? Why not!

Let's go to our Lambda function (the file called functions/getinfo/index.js) and replace the code with the following:

```javascript
'use strict';
const util = require('util');
const AWS = require('aws-sdk');
const rekognition = new AWS.Rekognition({region: process.env.AWS_REGION});

const createResponse = (statusCode, body) => {
    
    return {
        "statusCode": statusCode,
        "headers": {
            'Access-Control-Allow-Origin': '*'
        },
        "body": JSON.stringify(body)
    }
};
exports.handler = (event, context, callback) => {
    const body = JSON.parse(event.body);
    const srcBucket = body.bucket;
    const srcKey = decodeURIComponent(body.key ? body.key.replace(/\+/g, " ") : null); 

    var params = {
        Image: {
            S3Object: {
                Bucket: srcBucket,
                Name: srcKey 
            }
        }
    };

    setTimeout(function(){
        rekognition.recognizeCelebrities(params).promise().then(function(result) {
        rekognition.detectLabels(params).promise().then(function (data){
            result.Labels = data.Labels;
            callback(null, createResponse(200, result));
        });
    }).catch(function (err) {
        callback(null, createResponse(err.statusCode, err));
    })},3000);    
};
```

We have added a new and awesome feature! Now we not only get the labels of each photo but we get famous labels added to our application.

Let's test the pipeline with, again:

````bash
cd ServerlessOps-repository
git add -A
git commit -m "Adding famous labels to the application."
git push
````

After the pipeline has propagated the change, go back to your application... Can you see the difference?

If you are ready, go to the next [section](../../documentation/4_operations_advanced_features)

