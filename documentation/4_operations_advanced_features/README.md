## 4. [Operations: Advanced Features] (documentation/4_opeations_advanced_features)
### 4.1. Setup your frontend.
### 4.2. Blue Green Deployments
### 4.3. API Gateway Canary releases.
### 4.4. Lambda Concurrency.


## Step 3: The front end.

In order to make this web page available for every customer, we will have to upload it to S3. 

### Step 3.1: Prepare the front-end. 

The first step is to modify the javascript to point to the API created by your pipeline and the image to review. 

1. Go to the AWS API Gateway console.
2. Select the API *ServerlessOps-api*.
3. Under Stages, select *Prod*.
4. Copy the Invoke URL presented there.
5. Open the file under the project tree: 

	```
	ServerlessOps > frontend > front-js > assets.js
	```
6. Change the variable api with the URL copied before.


### Step 3.2: Upload the front-end.

Now, let's upload this content to S3.

1. Create bucket called:

	```
	serverless-ops-frontend-<your-alias>
	```
1. Upload all the content within the folder *frontend*.

	Configure your bucket for Website hosting by following these 3 simple steps in our documentation:

 - https://docs.aws.amazon.com/AmazonS3/latest/dev/HowDoIWebsiteConfiguration.html

1. Change the bucket name and confirm that the image is in the bucket. (the image should be in the same bucket as the front-end).

Now we should be able to open the application locally by opening the file:

```
ServerlessOps > frontend > index.html
```


Now, go to your application and test it!

## Step 4: Update your code to force a release!

Let's make our first release. We could simply use a release change within the pipeline console but, in order to demonstrate the automation, we will do it directly from the console/git command:

1. Run the following git commands:

	```
	git add -A
	git commit -m "My first commit! - ServerlessOps"
	git push
	```

2. Go back to the CodePipeline Console to see the release.

The code will stop at staging, yet the Pipeline won't have generated any resources such as APIs, Lambdas... Why? Because the Pipeline should have generated a ChangeSet. You can go to CloudFormation, select the stack and execute the change set.

A final stage should be added to the pipeline. ExecuteChangeSet is required.

1. On the CodePipeline console, click on *Edit*.
2. At the bottom of your pipeline, click on the icon *+ Stage*.
3. Enter a stage name like *ExecuteChangeSet*.
4. Click on Action.
5. Under Action Category, select *Deploy*.
6. Name the action *ExecuteChangeSet*.
7. The deployment provider will be CloudFormation.
8. Under Action mode, select *Execute a change set*.
9. Select the stack and the Change set name.
10. Save the Stage and click on *Save pipeline changes*.

Now, it's time to make a change. Our web application is clearly incomplete! We need to find out the celebrities in our photo!

To do this, we need to change the code behind this file:
 
 ```
 functions/getinfo/index.js
 ```
With the content within

```
functions/getinfoenhanced/index.js
```

After doing it, we need to commit these changes. Use the previously mentioned git commands to push the code to git commit:
 
```
git add -A
git commit -m "Adding celebrities to the result."
git push
```

## Step 5: Let's review our deployment!

Now that we have made a change on our code it should be reflected on the result. But wait... Does it? No! We are B/G deploying it! Follow these steps:

1. Go to CodeDeploy and select the deployment that starts with ServerlessOps-stack.
2. Under status, you should see an identifies starting with "d-". Click it.

<img src="../images/codedeploy.png" />

We are shifting traffic 10% each minute! This has been done using 3 lines on sam:

```
AutoPublishAlias: live
      DeploymentPreference:
        Type: Linear10PercentEvery1Minute
```

You can run tests against the application to find see the different requests.


## Step 6: Set concurrency in your Lambda Function.

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