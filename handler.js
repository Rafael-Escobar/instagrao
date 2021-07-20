'use strict';

const AWS = require('aws-sdk'); 
const S3 = new AWS.S3();
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const sizeOf = require('image-size')
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const table_name = process.env.DYNAMODB_TABLE

module.exports.extractMetadata = async (event, context, callback) => {

  var bucket = event['Records'][0]['s3']['bucket']['name']
  var key = event['Records'][0]['s3']['object']['key']
  var size = event['Records'][0]['s3']['object']['size']
  var extension = key.split(".").slice(-1)[0]
  var params = { Bucket: bucket, Key: key };
  var hash = crypto.createHash('md5').update(key).digest('hex');
  const response = {
    statusCode: 200,
    body: JSON.stringify({
      s3objectkey: hash,
    })
  }
  try {
    const file = await S3.getObject(params).promise()
    var { height, width, type } = sizeOf(file.Body)
    var image_data = {
      TableName: table_name,
      Item: {
        s3objectkey: hash,
        key: key,
        size: size,
        height: height,
        width: width,
        extension: type,
        bucket: bucket
      },
    };
    await dynamoDb.put(image_data).promise()
    console.log(image_data.Item);
  } catch (err) {
    console.log(err);
    response.statusCode = 400
    response.body = JSON.stringify({
      err: err
    })
  } finally {
    callback(null, response)
  }
};

module.exports.getMetadata = async (event, context, callback) => {
  const key = event["pathParameters"]["s3objectkey"]
  const response ={
    statusCode: 200,
    body: JSON.stringify({
      Message: "getMetadata"
    })
  }
  const params = {
    TableName: table_name,
    Key: {
      s3objectkey: key
    },
    AttributesToGet:[
      "width",
      "height",
      "size"
    ]
  }
  try {
    console.log(`Searching for file ${params.Key}`);
    dynamoDb.get(params, function (err, data) {
      if (err) {
        console.log(err);
        response.statusCode = 404
        response.body = JSON.stringify({message:"file not found"})
      }else{
        console.log(data);
        response.body = JSON.stringify({data})
      }
    });
  } catch (err) {
    console.log(err);
    response.statusCode = 400
  } finally {
    callback(null, response)
  }
};

module.exports.getImage = async (event, context,callback) => {
  const key = event["pathParameters"]["s3objectkey"]
  const response = {
    statusCode: 404,
    headers:{}
  }
  
  const params = {
    TableName: table_name,
    Key: {
      s3objectkey: key
    }
  }
  try {
    console.log(`Searching for file ${params.Key}`);
    dynamoDb.get(params, function (err, data) {
      if (err) {
        console.log(err);
        response.statusCode = 404
        response.body = JSON.stringify({ message: "file not found" })
      } else {
        console.log(data);
        var params_file = {
          Bucket: data.Item.bucket,
          Key: data.Item.key,
        };
        var url = S3.getSignedUrl('getObject', params_file);
        console.log(`url to the file [${key}] :${url}`)
        response.statusCode = 301
        response.headers = {
          'Location': url
        }
      }
    });
  } catch (err) {
    console.log(err);
    response.statusCode = 400
  } finally {
    callback(null, response)
  }
};

module.exports.getInfoImage = async (event, context, callback) => {
  const response = {
    statusCode: 501,
  }
  callback(null, response)
  
  // const response ={
  //   statusCode: 200,
  //   body: JSON.stringify({
  //     Message: "getInfoImage"
  //   })
  // }
  // try {
  //   var params = { 
  //     TableName: table_name, 
  //     KeyConditionExpression:'size > :size',
  //     ExpressionAttributeValues: {":size":0},
  //   }
  //   dynamoDb.query(params, function (err, data) {
  //     if (err) {
  //       console.log(err);
  //       response.statusCode = 204
  //       response.body = JSON.stringify({ message: "file not found" })
  //     } else {
  //       console.log(data);
  //       response.statusCode = 200
  //       response.body = data
  //     }
  //   });
  // } catch (err) {
  //   console.log(err);
  //   response.statusCode = 400
  // } finally {
  //   callback(null, response)
  // }
}