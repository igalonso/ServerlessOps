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
    // Read from querystring
    // Object key may have spaces or unicode non-ASCII characters.
    
    //const srcBucket = event.queryStringParameters.bucket;
    //const srcKey = decodeURIComponent( event.queryStringParameters.key.replace(/\+/g, " ")); 
     
    
    // Read from request JSON payload
    // Object key may have spaces or unicode non-ASCII characters.
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

    rekognition.recognizeCelebrities(params).promise().then(function (data) {
        console.log(createResponse(200,data.CelebrityFaces));
        callback(null, createResponse(200,data.CelebrityFaces));
    }).catch(function (err) {
        callback(null, createResponse(err.statusCode,err));
    });
};