# Closing and next steps

All right! We have covered different topics related with the operations with Serverless technologies. However, there are a lot of different topics that worth discussion. We provide more guidance on the [Wild Rydes Workshop](https://github.com/awslabs/aws-serverless-workshops/tree/master/DevOps) about multi-stage pipeline, uni-testing an API, analyze and debug the Unicorn API to dive a bit deeper into ServerlessOps.

Let's finish this workshop by cleaining all the resources:

1. Go to CodePipeline console and click in your Pipeline.
2. Click on **Edit**, then click on **Delete** and confirm.
3. Got to CodeBuild console and select **ServerlessOps_build**. Open the **Actions** dropdown menu and click **delete**. Confirm the deletion(with the CloudWatch group).
4. Go to CodeCommit Console.
5. Click in you respository **ServerlessOps_Repository**.
6. Click on Settings.
7. At the bottom, click on Delete repository. Confirm the deletion.
1. Go to CloudFormation Console.
2. Select **ServerlessOps-stack** > *Actions* and *Delete stack*. Wait for the deletion to complete.
3. Go to S3 and delete all the object within the bucket you have created. 
3. Select **ServerlessOps-step0-stack** > *Actions* and *Delete stack*.
4. Verify all the resources have been deleted.

To finish, you can visit the [following issue](https://github.com/igalonso/workshop-ServerlessOps/issues/20) where we will keep a discussion about different ways to tests our Serverless Application and do it a Serverless way. For example, how do we implement a Serverless uni-test stage on our pipeline. Do you want to Join?
