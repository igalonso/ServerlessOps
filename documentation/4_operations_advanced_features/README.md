# 4. Operations: Advanced Features - WARNING: MEMES AHEAD

Now you are prepare for some advaneced features. We have created a pipeline, changed different settings and reduced the operational overhead of our deployments. It's time to execute at the most reliable level!

<img src="../images/joke-continious-delivery.png" width="75%" />

## 4.1 What about CodeStar?

You have successfully deployed your first pipeline from the repository till final deployment. However, I would like to share a little secret with you. All of this job is automatically done with CodeStar!

<center><img src="../images/codestar-logo.png"/></center>


<details>
<summary><strong>These steps are not required for the workshop. These are just optional.</strong></summary><p>
To do so, you just need to follow these steps:

1. Go to the **CodeStar** Console.
2. Click on **+ Create a new project**.
3. Select the type of project you want to deploy. For example, during this workshop we used **Web Application**, **NodeJs**, and **AWS Lambda**.

4. Select the option left.
	<img src="../images/4_codestar_option.png" />
5. Select a name fo your project and chose beween CodeCommit and GitHub and click next.
6. Click on **Create Project**.

After these steps, and some more time for the project to build, you will see that the pipeline has been created! Of course, this is not required for this workshop but keep it in mind if you want to start fast and easy.

</details>



## 4.2: Blue Green Deployments

One of the most requested features for Serverless applications is the possibility of shifting the traffic to, for example, prevent failing deployments to impact your application entirely. 

Others would like to shift the traffic to monitor if their infrastructure (behind the scenes) can stand it.

With Lambda, you can easily create this traffic shifting feature with just a few lines of SAM code:

### 4.2.1: Update your deployment preference

1. Go to the file *template.yaml* and add these lines under **Properties** of the resource **LambdaFunction** (be careful with extra spaces/tabs since yaml is sensitive to these differences):

	```yaml
	DeploymentPreference:
		Type: Linear10PercentEvery1Minute
	```

2. We need to perform a visible change on our infrastructure to see how it works. Change your function code to this in your development environment.

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
	            rekognition.detectText(params).promise().then(function (detectedtext){
	                result.TextDetections = detectedtext;
	                rekognition.detectLabels(params).promise().then(function (labels){
	                    result.Labels = labels.Labels;
	                    callback(null, createResponse(200, result));
	                });
	            });
	    }).catch(function (err) {
	        callback(null, createResponse(err.statusCode, err));
	    })},3000);
	};
	```

Now, let's do a deployment!

<img src="../images/joke-rollback.png" width="50%"/>

### 4.2.2: Update your code to force a release!

Let's make our release. As we did on previous steps, we will do it directly from the console/git command:

1. Run the following git commands:

	```
	git add -A
	git commit -m "My first b/g commit! - ServerlessOps"
	git push
	```

2. After a few minutes (when the pipeline finishes), go to CodeDeploy and select the deployment that starts with ServerlessOps-stack.
3. Under status, you should see an identifies starting with "d-". Click it.

<img src="../images/codedeploy.png" />

We are shifting traffic 10% each minute! This has been done using 2 lines on SAM. How awesome it is?

You can run tests (different requests) against the application to find see the different results. Sometimes it will give you the labels and sometime, text found on the picture! 

While th frontend could be a good resource to test these B/G changes, you might want to use a tool like [PostMan](https://www.getpostman.com/) to send a POST request to your API faster.

<img src="../images/4_postman-test.png" />

### 4.2.3 OPTIONAL - Use hooks and alarms.
<details>
<summary><strong>Optional Blue/Green deployment exercise (expand for details)</strong></summary><p>
Now that you have seen how easy is to deploy with blue green deployments, you might want to investigate hooks and alarms to monitor and trigger automated rollback of your deployments.

```yaml
Alarms:
	# A list of alarms that you want to monitor
	- !Ref AliasErrorMetricGreaterThanZeroAlarm
	- !Ref LatestVersionErrorMetricGreaterThanZeroAlarm
```

During traffic shifting, if any of the CloudWatch Alarms go to Alarm state, CodeDeploy will immediately flip the Alias back to old version and report a failure to CloudFormation.

If you want to implement this feature, you can start by creating an alarm and prepare and reference it in your *template.yaml*. Then, using [set-alarm-state](https://docs.aws.amazon.com/cli/latest/reference/cloudwatch/set-alarm-state.html) you can change it into *ALARM* and rollback the deployment you want.


```yaml
Hooks:
	# Validation Lambda functions that are run before & after traffic shifting
	PreTraffic: !Ref PreTrafficLambdaFunction
	PostTraffic: !Ref PostTrafficLambdaFunction
```

Before traffic shifting starts, CodeDeploy will invoke the PreTraffic Hook Lambda Function. This Lambda function must call back to CodeDeploy with an explicit status of Success or Failure, via the [PutLifecycleEventHookExecutionStatus](https://docs.aws.amazon.com/codedeploy/latest/APIReference/API_PutLifecycleEventHookExecutionStatus.html) API. On Failure, CodeDeploy will abort and report a failure back to CloudFormation. On Success, CodeDeploy will proceed with the specified traffic shifting.

If you want to implement this feature, you can create a Lambda function based on [this one](https://github.com/awslabs/serverless-application-model/blob/master/examples/2016-10-31/lambda_safe_deployments/src/preTrafficHook.js). For example, for the shake of this workshop, you can use a random choice such as **1** equals, it's validated, **0** has failed. Here is, for example, a pice of the code you might want to use:

```javascript
var rand_status = 'Succeeded';
if(Math.floor(Math.random() * Math.floor(2)) < 0){
	rand_status = 'Failed';
}

var params = {
    deploymentId: deploymentId,
    lifecycleEventHookExecutionId: lifecycleEventHookExecutionId,
    status: rand_status
};
```

Or if you want to go beyond that, try to build your first integration test!

</p></details>

## 4.3. API Gateway Canary releases.

Sure, we have tested how to perform incremental deployments on our code but, when we do changes on our API, often, we need to test it first. Our customers love Canary testing because it allows them to test their API changes with real traffic yet it won't impact heavily their customer experience.

With API gateway, you can deploy these changes easily on an percentage of resources going to your API by using the API Gateway canary release option.

To do so, follow these steps:

1. Go to the API Gateway console and click on *Stages* of the *ServerlessOps-api*.
2. Click on the Stage where you want to add Canary. In this case, *Prod*.
2. Click on the *Canary* tab.
3. Click on *Create canary*.
4. Under *Percentage of requests directed to Canary* edit it and put 10%. This will route 10% of your traffic to the Canary release of your API.
	<img src="../images/canary-percentage.png"/>
6. Now, let's make a change to be promoted. Under the same API go to *Gateway Response*.
7. Look for *Missing Authentication Token* and open it. The Body Mapping Template should look like this:

	```bash
	{"message":$context.error.messageString}
	```

8. Change it to this:

	```bash
	{"message-customized":$context.error.messageString}
	```
9. Click on *Save*.
10. Now, click on *Resources*, *Actions* and click *Deploy API*.
11. Select the API Stage Prod. It will prompt a message saying that the canary release is enabled on this Stage. Click *Deploy*.

Now, let's test this feature:

1. Use the following command with the appropiate parameters for your API:

``` bash
curl -X POST   https://<api-id>.execute-api.us-east-1.amazonaws.com/Prod/a-ramdom-name-that-will-trigger-403 'Content-Type: application/json' -d '{ "bucket": "serverlessops-step0-stack-serverlessopsfrontend-<bucket-id>","key": "someguy.jpg"}'
```

<img src="../images/4_postman-test.png" />

Didn't work? Are you seeing the "*message-customized*" response? Of course not! you need to try to several times since only 10% of the traffic is going to the canary! Try a little harder.

<img src="../images/joke-canary.png" width="80%"/>

Now what? Did it work? Of course! We are ready to promote this Canary to release version. Go to *Stages > Prod > Canary* and click on Promote Canary and then OK.

<img src="../images/canary-promote.png" width="50%"/>

Then, test a few *curls* more.

It might take a while to propagate all the changes but you will see that, after a few attempts, all the responses have the *message-customized* response.

## 4.3. Lambda Concurrency.

AWS Lambda limits your concurrency to 1000 concurrent executions within one region. Of course, these limits can be updated by requesting a limit increase to our support team. However, it is always a good idea to limit your functions to certain amount of concurrent executions.

Let's put an example: We have our own environment with several developers pushing code and testing lambda functions. We are deeply into Serverless! Some of these functions are just for testing purposes but one of our developers is doing a load test to see how does it react to heavy load. Because of this, his tesing lambda function is taking 900 concurrent executions letting only 100 left for the rest of your Lambda functions. Luckily, you followed the best practices and split testing and production in two different accounts so this is not impacting your production environment but, of course, the rest of the developers are seeing 429 in the Lambda execution whenever they trigger their functions. You got several angry developers!

Another use case would be to "reserve" capacity for our Lambda function so other Lambda executions won't take these.

For the purpose of this workshop, we are going to limit the concurrency of our function to 25. You probably noticed in the code that there is "wait" of 3000 seconds.

```JAVASCRIPT
setTimeout(function(){...
},3000);
```
This has been made on purpose to force your Lambda function to have concurrent executions.

Let's test our Lambda Function without concurrency. To do it, we recommend you to use an EC2 instance so you can install hey easily.

```bash
## If you don't have go installed:
sudo yum install go -y
## mac with brew
brew install go
##

go get -u github.com/rakyll/hey

##linux
./go/bin/hey -n 5000 -c 50 -d '{ "bucket": "serverlessops-step0-stack-serverlessopsfrontend-<your-alias-here>","key": "img/uploads/someguy.jpg"}' -H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo

##mac

~/go/bin/hey -n 5000 -c 50 -d '{ "bucket": "serverlessops-step0-stack-serverlessopsfrontend-<your-alias-here>","key": "img/uploads/someguy.jpg"}' -H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo 
```
This might take a while so you might want to grab a coffee or review the CloudWatch metrics (does it reflect the request count for this specific API?).

After some time, you should see the a result like this:

```bash
Response time histogram:
  5.452 [1]	|
  5.973 [3626]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  6.493 [1095]	|∎∎∎∎∎∎∎∎∎∎∎∎
  7.014 [185]	|∎∎
  7.534 [55]	|∎
  8.055 [24]	|
  8.575 [6]	|
  9.096 [3]	|
  9.616 [1]	|
  10.137 [2]	|
  10.658 [2]	|

Status code distribution:
  [200]	5000 responses
```

Let's enable concurrency in your Lambda. To do so, we will implement it via SAM. We are going to remove the blue green deployment and add a line for concurrency reserverd executions. Add the line `ReservedConcurrentExecutions` Your Lambda Function in SAM should look like this:

```yaml
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
            RestApiId: !Ref ApiGatewayApi
            Path: /getinfo
            Method: POST
      AutoPublishAlias: live
      ReservedConcurrentExecutions : 10
```

Seems like CloudFormation in SAM doesn't work right now:

 - aws lambda put-function-concurrency --function-name ServerlessOps-stack-LambdaFunction-<your-alias> --reserved-concurrent-executions 25

Now, as always, let's deploy it through our pipeline.

```bash
git add -A
git commit -m "Adding concurrecy limits"
git push
```
After the change is propagated, we can review it on our AWS Lambda console.

It is important to understand that this concurrency is shared between all the aliases and versions of this function. Lambda concurrency is function based.

To test this concurrency, let's go to our terminal and run the previous command command.



```bash
##linux
./go/bin/hey -n 5000 -c 50 -d '{ "bucket": "serverlessops-step0-stack-serverlessopsfrontend-<your-alias-here>","key": "img/uploads/someguy.jpg"}' -H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo

##mac

~/go/bin/hey -n 5000 -c 50 -d '{ "bucket": "serverlessops-step0-stack-serverlessopsfrontend-<your-alias-here>","key": "img/uploads/someguy.jpg"}' -H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo 
```


You will see something like this:

```bash
Response time histogram:
  0.083 [1]	|
  1.548 [500]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  3.012 [0]	|
  4.476 [457]	|∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎∎
  5.941 [15]	|∎
  7.405 [5]	|
  8.869 [1]	|
  10.334 [0]	|
  11.798 [0]	|
  13.262 [3]	|
  14.727 [18]	|∎

  ...
  Status code distribution:
  [502]	501 responses
  [200]	499 responses
```
As we can see here, the 502's responses has increased!

[Lambda Concurrent requests](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions)

## 4.4. Integration tests.

In this section we will extend the deployment pipeline we built in the previous section to include an automatic integration test step so we can improve our confidence on the changes being continuously introduced before them reach our production environment.

The changes that we will introduce will basically add a new QA environment so we can deploy the new version of our infrastructure/application to this new environment, run the integration tests again this just-deployed version and, only if tests succeeds, proceed with the deployment to our production environment.

Our integration test will be implemented using a new lambda function that will execute an HTTP request against the API Gateway endpoint (so the production lambda code will be executed and the invocation to Recognition as well) using a previously uploaded input (i.e. an image available in our S3 bucket corresponding to a well known celebrity) and validate that the HTTP response is okay (i.e. status code is 200) and the response contains the name expected celebrity.

### 4.4.1: Extend CFN template to support multiple environments.

Lets start by extending our CFN template to support multiple environments. To achieve that, we will use CFN parameters (https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/parameters-section-structure.html) so we can create multiple stacks (one for each environment or stage) using the same template with different values for the parameters.

We will edit our `template.yaml` file and add the following section just before the *Resources* section.

```yaml
Parameters:
  ApiStageParameter:
    Type: String
    Default: QA
    AllowedValues:
      - QA
      - Prod
```

Additionally, we will add the property *StageName* to the globals artifact (also within the `template.yaml` file) to use the just-added parameter instead of the previously hard-coded *Prod*.

```yaml
    StageName: !Ref ApiStageParameter
```

Commit and push the changes ...

````bash
git commit -am "adding stage param to API definition"
git push
````

Our pipeline will deploy the new version of the template and that will result in our stack being updated so the existing API Gateway will replace its stage (*Prod*) with a new stage named *QA*. We have not instructed CFN (invoked via our pipeline) to use any specific value for the just added parameter but since its default value is *QA*, the API Gateway will use that default value.

### 4.4.2: Extend deployment pipeline to include a PROD environment.

Lets now extend our deployment pipeline to include a new environment (aka stage) representing our production environment. This will be a complete copy of our artifacts (API Gateway and Lambda).

Go and edit the pipeline and add a new stage at the end of the pipeline (name it *Prod*).

Within the stage, add a new action with the following attributes:

* Action category -> Deploy
* Action name -> ServerlessOps-stack-Prod
* Deployment provider -> AWS CloudFormation
* Action mode -> Create or replace a change set
* Stack name -> ServerlessOps-stack-Prod
* Change set name -> ServerlessOps-changeset-Prod
* Template -> MyAppBuild::SAM-template.yaml
* Capabilities -> CAPABILITY_IAM
* Role name -> ServerlessOps-cloudformationrole
* Advanced -> Parameter overrides -> {"ApiStageParameter":"Prod"}
* Input artifacts 1 -> MyAppBuild

Note that this action is very similar to the existing one for our staging/QA environment but here we are overriding the default value for our input parameter to the CFN template in order to use *Prod* to represent our PROD API Gateway (and corresponding Lambda).

Next, as we did for the staging/QA environment, lets add a second action (just after the just created action) to actually execute the change set.

Again, add a new section with the following attributes:

* Action category -> Deploy
* Action name -> ExecuteChangeSetProd
* Deployment provider -> AWS CloudFormation
* Action mode -> Execute a change set
* Stack name -> ServerlessOps-stack-Prod
* Change set name -> ServerlessOps-changeset-Prod

### 4.4.4: Create the testing lambda (and its supporting artifacts).

Before we can use the testing lambda in our pipeline (do not desperate, we are almost there), we need to create it (and before that, we need to create the required IAM role).

Go to IAM console and create a new policy with the following JSON definition and name it *LogsAndPipeline*:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "logs:*"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
            "Action": [
                "codepipeline:PutJobSuccessResult",
                "codepipeline:PutJobFailureResult"
            ],
            "Effect": "Allow",
            "Resource": "*"
        }
    ]
}
```

Next, also in the IAM console, create a new role with the following configuration:

* Type of trusted entity -> AWS service -> Lambda
* Permissions -> Search for the just created policy (*LogsAndPipeline*) and select it
* Name -> LambdaForPipelineInvocation

Now we are ready to create the testing lambda. Go to Lambda console and create (author from scratch) a new function with the following configuration:

* Name -> HttpTest
* Runtime -> Node.js 4.3
* Role -> Choose an existing role
* Existing role -> LambdaForPipelineInvocation

Paste the following code for the function implementation:

```javascript
'use strict';

var assert = require('assert');
var AWS = require('aws-sdk');
var https = require('https');

exports.handler = function(event, context) {
    console.log(event);

    var codepipeline = new AWS.CodePipeline();

    // Retrieve the Job ID from the Lambda action
    var jobId = event["CodePipeline.job"].id;

    // Retrieve the value of UserParameters from the Lambda action configuration in AWS CodePipeline
    // In this case a set of request options which will be health checked by this function.
    var input = JSON.parse(event["CodePipeline.job"].data.actionConfiguration.configuration.UserParameters);
    console.log("input: " + JSON.stringify(input));

    // Notify AWS CodePipeline of a successful job
    var putJobSuccess = function(message) {
        var params = {
            jobId: jobId
        };
        codepipeline.putJobSuccessResult(params, function(err, data) {
            if(err) {
                context.fail(err);      
            } else {
                context.succeed(message);      
            }
        });
    };

    // Notify AWS CodePipeline of a failed job
    var putJobFailure = function(message) {
        var params = {
            jobId: jobId,
            failureDetails: {
                message: JSON.stringify(message),
                type: 'JobFailed',
                externalExecutionId: context.invokeid
            }
        };
        codepipeline.putJobFailureResult(params, function(err, data) {
            context.fail(message);      
        });
    };

    // Helper function to make a HTTP request to the page.
    // The helper will test the response and succeed or fail the job accordingly
    var getPage = function(input, callback) {
        var pageObject = {
            body: '',
            statusCode: 0,
            contains: function(search) {
                return this.body.indexOf(search) > -1;    
            }
        };

        const req = https.request(input.options, (res) => {
            console.log('Status:', res.statusCode);
            console.log('Headers:', JSON.stringify(res.headers));

            pageObject.body = '';
            pageObject.statusCode = res.statusCode;
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                pageObject.body += chunk;
            });
            res.on('end', function () {
                console.log('Successfully processed HTTPS response');
                callback(pageObject);
            });
        });
        req.on('error', function(error) {
            // Fail the job if our request failed
            putJobFailure(error);    
        });
        req.write(JSON.stringify(input.data));
        req.end();
    };

    getPage(input, function(returnedPage) {
        try {
            // Check if the HTTP response has a 200 status
            assert(returnedPage.statusCode === 200);
            // Check if the page contains the expected text
            assert(returnedPage.contains(input.expected));  

            // Succeed the job
            putJobSuccess("Tests passed.");
        } catch (ex) {
            // If any of the assertions failed then fail the job
            putJobFailure(ex);    
        }
    });     
};
```

Save it!

### 4.4.4: Add the integration tests step to the pipeline.

Lets go and wire our testing lambda in the pipeline so we can validate that a new version of the infrastructure and code is working as expected before deploying it to our production environment.

Go to pipeline and edit it, add a new stage in between our 2 environments (Staging and Prod). You can name it *Test*.

Within the stage, add a new action with the following attributes (please note that you need to replace *<your-api-id>* and *<your-alias-here>* in the *User parameters* with the corresponding values for your QA's environment API Gateway's ID and the S3 bucket where you will be putting your images respectively):

* Action category -> Invoke
* Action name -> Validate_HTTP_request
* Provider -> AWS Lambda
* Function name -> HttpTest
* User parameters -> {"options":{"hostname":"<your-api-id>.execute-api.us-east-1.amazonaws.com","port": 443,"path":"/QA/getinfo","method": "POST","headers":{"Content-Type":"application/json"}},"data":{"bucket":"serverlessops-step0-stack-serverlessopsfrontend-<your-alias-here>","key":"JeffB.jpg"},"expected":"Jeff Bezos"}

### 4.4.5: Upload the celebrity to be used as 'decoy'.

Grab the `JeffB.jpg` image below and upload it to the S3 bucket that is being used for image recognition ...

<img src="../images/JeffB.jpg" />

### 4.4.6: Profit!

Go and *Release change* in your pipeline (or even better, make a change in your code and push it) ...

### 4.4.7: Potential improvements

* Provision the test lambda function using CFN as well!
