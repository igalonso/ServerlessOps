# 3. Building your CI/CD pipeline
## 3.1. Set up your repository with CodeCommit.
## 3.2. Set up your pipeline with CodePipeline.
## 3.3. Build your project with CodeBuild.
## 3.4. Do your first push to you pipeline.
## 3.5. Modify your pipeline: add a ChangeSet execution Automation.


## Step X: Building the Pipeline!

### Step X.1: Create IAM git credentials - SSH

Now, we have our deployment ready to go. To start building our pipeline, we need to create keys to our IAM user to be able to push/pull code from CodeCommit (our respository). Continue this guide to create these keys.

#### Step X.1.1: SSH and Linux, macOS, or Unix: Set Up the Public and Private Keys for Git and AWS CodeCommit

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

### Step 2.2: Create a CodeCommit repository.

1. Go to the CodeCommit repository and click on **Create Repository**

<img src="../images/codecommit_create_repository.png" width="70%" />

2. Enter a repository name such as **ServerlessOps_Repository**
3. Skip Configure email notifications' step.
4. Follow the steps provided by CodeCommit to **Connect to your repository**

<img src="../images/codecommit_connect_instructions.png" />

By now, you should have a folder called **ServerlessOps-repository**.

1. Copy the content of the folder **ServerlessOps_workshop** to the recently created **ServerlessOps_Repository**
2. Run these commands to perform the inital commit:

### Git clone + unzip + next steps

<img src="../images/codecommit_copy_content.png" />

!Insert images here.

Then, let's do our initial commit to the repository with the following steps:

````bash
cd ServerlessOps-repository
git add -A
git commit -m "initial commit"
git push
````
Go to the **CodeCommit** console to verify that the content has been added.

##### Note: The *yaml* template - SAM!

The folder with the code has the following tree:

    ├── README.md
    ├── *buildspec.yml*
    ├── documentation
    │   └── images
    │       └── ...
    ├── frontend
    │   ├── assets
    │   │   └── ...
    │   ├── front-js
    │   │   ├── assets.js
    │   │   └── ...
    │   ├── *index.html*
    │   └── ...
    ├── functions
    │   ├── getinfo
    │   │   └── *index.js*
    │   └── getinfoenhanced
    │       └── *index.js*
    ├── old
    │   └── ...
    ├── swagger.yaml
    └── *template.yaml*

The important files here are represented by *name of the file *.

The SAM template is called **template.yaml** and has two resources:
1. An API
2. A function

The function has an API method defined in the API as the event trigger. This method is define in the file **swagger.yaml** as well as some other features such as CORS.

During this Lab we will modify the function **"getinfo"** with the code within **"getinfoenhanced"** to demonstrate how can propagate a change within the pipeline and deploy it in a Blue/Green matter.


## Step 2.3: Creating the pipeline with CodePipeline

Before you start, change the file ```buildspec.yml``` to add your alias in the command.


1. Go to the CodePipeline console and click on **Get Started**
2. Create a Pipeline with the name **ServerlessOps_pipeline** and click on next step.

<img src="../images/codepipeline1.png" />

### Step 2.3.1 Create the source of your pipeline.

3. Drop down the service provider and select **CodeCommit**.
4. Look for the repository name created previously and select it.
5. Select the Branch name **master**.

<img src="../images/codepipeline2.png" />

After defining our source, we will chose **CodeBuild** as our build provider. Click on Next Step.

### Step 2.3.2: How to create a CodeBuild project for your serveless pipeline

Here we are going to select the build provider. In this case, we will use CodeBuild.

In the phase of creating a build project, we select "Create a new build project".

Within the project, the file buildspec.yml has the information necesary for your deployments. If we inspect this file, we will find that the deployment generages a file calles SAM-template.yaml which replaces the "local code" with a file within the S3 bucket previously provided.

1. Name it as *ServerlessOps_build*.
2. Select *Use an image managed by AWs CodeBuild*.
3. Chose *Ubuntu* as the Operating system.
4. Select *Node.js* as the runtime.
5. Select Version *4.3.2*.
3. Select *Create a service role in your account*. We will review it after creating the pipeline.
4. Click on *Save build project*

<img src="../images/codepipeline3.png" />

### Step 2.3.3: Select the deploy phase using CloudFormation.

Click on Next Step once you have created your build project. Altough SAM (behind the scenes) will use CodeDeploy, SAM is based in CloudFormation and the deploy will do it as well.

1. Select *CloudFormation* as the deployment provider.
2. Chose *Change or replace a change set* as the Action Mode.
3. Name the Stack **ServerlessOps-stack**
4. Name the Change set as **ServerlessOps-changeset**
5. The template file that CodeBuild generates is *SAM-template.yaml*. Set it under Template file.
6. Select Capabilities *CAPABILITIES_IAM*
7. This is the role assumed by CloudFormation to deploy your code. For the shake of this training, we will use Administration permissions. Please bare in mind that these permissions should be the ones used by your stack (such as creating an API, Lambda Function, S3...). *Create/use an IAM role for CloudFormation with Administrator permissions*.
8. In the next step we will *define the role used by CodePipeline* to access resources such as CodeBuild, CodeCommit, S3... If you have created a role previously, you can use it, if not click on Create role. By allowing the default policy, it will create a role called *AWS-CodePipeline-Service*. Then, click *Next Step*.
9. Review the configuration and create the pipeline.
<img src="../images/codepipeline4.png" />

### Step 2.3.4: Review the CodeBuild IAM role to add S3 Permissions.

The IAM role created by CodeBuild doesn't have the specific permissions for the instruction needed on it's buildspec.yml:

```
aws cloudformation package --template-file template.yaml --s3-bucket  serverless-ops-my-deployments-<your-alias> --output-template-file SAM-template.yaml
```

After creating the pipeline, you will see that it fails during the build phase due to a permissions issue. We need to add these permissions (S3).

1. Go to the IAM Console and look for the role.
2. Attach an S3 administator policy to this role.


<details><summary>CodeBuild Role:</summary>

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

</details>

### Now, go to CloudFormation, execute change set.

