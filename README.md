# ServerlessOps Workshop

<img src="documentation/images/devops.png" center/>

### *Under develop*:


--------
Check [issues tab](../../issues)

--------


## The application workflow

Here you can see a diagram with the workflow of the actual application:

<img src="documentation/images/diagrams/serverlessops-workshop-app1.png" />

From the webpage we are going to deploy, we will perform a POST request to our API. This API will trigger a Lambda that, initially, will get the Labels on the image showed on our web app and finally, we will show these labels on the web.

However, this is not the important part. Let's take a look at this new diagram:

<img src="documentation/images/diagrams/serverlessops-workshop-workflow.png" />

In this session you will learn the basis of Serverless Operations which includes how to manually create a pipeline, review a SAM template, debug your code with SAM Local, blue green deployments and Canary releases of your API. Are you ready?

## Introduction

To start, please download the zip file with the content on this GitHub. To do this, under the green button, use *Clone or Download*

<img src="documentation/images/0_download_content.png" />

Then, you can start with the first step:

1. [Preparing the environment](documentation/1_preparing_environment)
2. [Develop with Cloud9](documentation/2_develop_with_cloud9)
3. [Building your CI/CD pipeline](documentation/3_building_your_ci_cd_pipeline)
4. [Operations: Advanced Features](documentation/4_operations_advanced_features)
5. [Closing and next steps](documentation/5_closing_and_next_steps).
