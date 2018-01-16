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