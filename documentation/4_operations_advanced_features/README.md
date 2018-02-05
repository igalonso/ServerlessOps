# 4. Operations: Advanced Features

## 4.1: Blue Green Deployments

One of the most wanted features for Serverless applications is the possibility of shifting the traffic to, for example, prevent failing deployments to impact your application entirely. Some others like to shift the traffic to monitor if their infrastructure (behind the scenes) can stand it. 

With Lambda, you can easily create this traffic shifting feature with just a few lines of SAM code:

### 4.1.1: Update your deployment preference

1. Go to the file *template.yaml* and uncomment these lines:

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
	        rekognition.detectLabels(params).promise().then(function (data){
	            result.Labels = data.Labels;
	            callback(null, createResponse(200, result));
	        });
	    }).catch(function (err) {
	        callback(null, createResponse(err.statusCode, err));
	    })},3000);    
	};
	```

Now, let's do a deployment!



### 4.1.2: Update your code to force a release!

Let's make our release. As we did on previous steps, we will do it directly from the console/git command:

1. Run the following git commands:

	```
	git add -A
	git commit -m "My first b/g commit! - ServerlessOps"
	git push
	```

2. Go to CodeDeploy and select the deployment that starts with ServerlessOps-stack.
3. Under status, you should see an identifies starting with "d-". Click it.

<img src="../images/codedeploy.png" />

We are shifting traffic 10% each minute! This has been done using 2 lines on SAM. How awesome is it?

You can run tests (different requests) against the application to find see the different results.

### 4.1.3 OPTIONAL - Use hooks and alarms.
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

If you want to implement this feature, you can create a Lambda function based on [this one](https://github.com/awslabs/serverless-application-model/blob/master/examples/2016-10-31/lambda_safe_deployments/preTrafficHook.js). For example, for the shake of this workshop, you can use a random choice such as **1** equals, it's validated, **0** has failed. Here is, for example, a pice of the code you might want to use:

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

## 4.2. API Gateway Canary releases.


## 4.3. Lambda Concurrency.

##Change on CloudFormation!! 

https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-lambda-function.html#cfn-lambda-function-reservedconcurrentexecutions


AWS Lambda limits your concurrency to 1000 concurrent executions within one region. Of course, these limits can be updated by requesting a limit increase to our support team. However, it is always a good idea to limit your functions to certain amount of concurrent executions. 

Let's put an example: We have our own environment with several developers pushing code and testing lambda functions. We are deeply into Serverless! Some of these functions are just for testing purposes but one of our developers is doing a load test to see how does it react to heavy load. Because of this, his tesing lambda function is taking 900 concurrent executions letting only 100 left for the rest of your Lambda functions. Luckily, you followed the best practices and split testing and production in two different accounts so this is not impacting your production environment but, of course, the rest of the developers are seeing 429 in the Lambda execution whenever they trigger their functions. You got several angry developers! How can we avoid this?

Another use case would be to "reserve" capacity for our Lambda function so other executions won't take it.

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

./go/bin/hey -n 1000 -c 50 \
-d '{ "bucket": "serverless-ops-frontend-<your-alias-here>","key": "someguy.jpg"}' \ 
-H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo
```

At this point, this code should have been released. Let's manually set the concurrency for our Lambda Function.

1. Go to the Lambda Console.
2. Select the Lambda Function deployed by our SAM template (starts with *ServerlessOps-stack-LambdaFunction-)*.
3. Under Configuration tab, set the concurrency to 25.

![Add concurrency](documentation/images/lambda-concurrency.png)
4. Save the function.

It is important to understand that this concurrency is shared between all the aliases and versions of this function. Lambda concurrency is function based.

To test this concurrency, let's go to our terminal and run the previous command command.



```bash
./go/bin/hey -n 1000 -c 50 \
-d '{ "bucket": "serverless-ops-frontend-<your-alias-here>","key": "someguy.jpg"}' \ 
-H 'Content-Type: application/json' -m POST https://<your-api-endpoint>/Prod/getinfo
```

You will definitely see something like this:

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