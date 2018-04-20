# 2. Develop with Cloud9

In this section, you are going to use [AWS Cloud9](https://aws.amazon.com/cloud9/) to code, test and debug your serverless API. 

[AWS Cloud9](https://aws.amazon.com/cloud9/) is a full-fledged cloud-based integrated development environment (IDE) that lets you write, run, and debug your code with just a browser. It comes prepackaged with essential tools for popular programming languages, including Node, Python, PHP, Java and more.

[AWS Cloud9](https://aws.amazon.com/cloud9/) integrates seamslessly with serverless applications on the AWS platform by leveraging the [AWS Serverless Application Model](https://github.com/awslabs/serverless-application-model) - SAM - to streamline the definition of serverless APIs, and [SAM local](https://github.com/awslabs/aws-sam-local) to allow you to easily test and debug your API locally.

<center>
<a href="https://aws.amazon.com/cloud9/" target=_blank><img src="../images/aws-cloud9.png" alt="AWS Cloud9" height="177px"/></a>
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
<a href="https://github.com/awslabs/serverless-application-model" target=_blank><img src="../images/sam.png" alt="Serverless Application Model"/></a>
</center>

## 2.1. Create your cloud-based development environment

Navigate to the [AWS Cloud9 management console](https://console.aws.amazon.com/cloud9/home). Make sure the AWS Region selector matches the one you have been working with so far. 

Click **Create Environment**.

![Create environment](../images/2100-cloud9-create-environment.png)

On the *Name environment* page set *Name* to `serverlessIDE` and click **Next step**.

On the *Configure settings* you specify the instance type that your cloud IDE is going to be running on, the idle time it will wait until it auto-hibernates (cost savings) and the network characterization (VPC). Leave all the defaults and click **Next step**

![Configure settings](../images/2101-cloud9-environment-settings.png)

The *Review* page summarizes the characteristics of your Cloud9 environment. Proceed to provisioning it by clicking **Create environment**. After a couple of minutes your cloud-based IDE will be ready to go.

![ServerlessIDE](../images/2103-cloud9-environment.png)

It looks pretty much like any IDE you are used to, doesn't it? 

The *Environment pane*, on the left side of the screen, shows a list of folders and files in your project. The *Editor pane*, on the right, is where you will write, test and debug code.  

## 2.2. Code, test & debug your serverless API

On the *Environment pane* right click over the root folder and select **New Folder**.

![New folder](../images/2200-cloud9-new-folder.png)

Specify `functions` as folder name. Right click over the `functions` folder to create another one called `getinfo`.

![Folder structure](../images/2201-cloud9-folder-structure.png)


Right click on the `getinfo` folder and select *New file*. Name it `template.yaml`. This is the YAML-formated SAM template that describes your serverless API. Double click on in to open the editor. On the *Editor pane* paste the following content.

```yaml
AWSTemplateFormatVersion : '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: AWS SAM template with API defined in an external Swagger file along with Lambda integrations and CORS configurations


Globals:
  Api:
    Cors:
      AllowMethods: "'OPTIONS,POST'"
      AllowHeaders: "'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token'"
      AllowOrigin: "'*'"
      MaxAge: "'600'"

Resources:
  LambdaFunction:
   Type: AWS::Serverless::Function
   Properties:
      CodeUri: functions/getinfo
      Description: "Backend Lambda for Serverless Ops Workshop"
      Handler: index.handler
      Timeout: 60
      Policies: 
        - AmazonRekognitionFullAccess
        - AmazonS3ReadOnlyAccess
      Runtime: nodejs4.3
      Events:
        ProxyApiRoot:
          Type: Api
          Properties:
            Path: /getinfo
            Method: POST
      AutoPublishAlias: live

Outputs:
  ApiURL:
      Description: "API endpoint URL for Prod environment"
      Value: !Sub "https://${ServerlessRestApi}.execute-api.${AWS::Region}.amazonaws.com/Prod"
``` 



Name it `index.js`. This will be the source code for your serverless API. Double click on `index.js` to open the file. On the *index.js* tab on the *Editor pane* paste the following Node.js construct 


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
        rekognition.detectLabels(params).promise().then(function (data) {
            console.log(createResponse(200, data.Labels));
            callback(null, createResponse(200, data));
        }).catch(function (err) {
            callback(null, createResponse(err.statusCode, err));
    })},3000);
};
``` 

If you see a welcome page click **Get started**.

1. In the navigation pane on the left, click on the **Crawlers** link.


## 2.2. Debugging.