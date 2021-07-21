'use strict';

const AWS = require('aws-sdk'); 
const S3 = new AWS.S3();
AWS.config.update({ region: "us-east-1" });
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
  var params = { Bucket: bucket, Key: key };
  var hash = crypto.createHash('md5').update(key).digest('hex');
  var response = {
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
  var response ={
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
  var response = {
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
function metadataReport(data){
  var litle = { size: data[0].size, key: data[0].s3objectkey}
  var bigger = { size: data[0].size, key: data[0].s3objectkey}
  var amount = {}

}
module.exports.getInfoImage = async (event, context, callback) => {
  var response ={
    statusCode: 200,
    body: JSON.stringify({
      Message: "getInfoImage"
    })
  }
  try {
    var params = { 
      TableName: table_name, 
    }
    dynamoDb.scan(params, function (err, data) {
      if (err) {
        console.log(err);
        response.statusCode = 200
        response.body = JSON.stringify({ Message: err })
        response.headers = {
          'Erro': "erro"
        }
      } else {
        console.log(data);
        response.statusCode = 200
        var report = {
          smaller: { size: data.Items[0]["size"], s3objectkey: data.Items[0]["s3objectkey"] },
          bigger: { size: data.Items[0]["size"], s3objectkey: data.Items[0]["s3objectkey"] },
          amount: {}
        }
        data.Items.forEach((item) => {
          if (item["size"] < report.smaller["size"]) {
            report.smaller["size"] = item["size"]
            report.smaller["s3objectkey"] = item["s3objectkey"]
          }
          if (item["size"] > report.bigger["size"]) {
            report.bigger["size"] = item["size"]
            report.bigger["s3objectkey"] = item["s3objectkey"]
          }
          if (item["extension"] in report["amount"]) {
            report["amount"][item["extension"]] += 1
          } else {
            report["amount"][item["extension"]] = 1
          }
        });
        report["extension"] = Object.keys(report["amount"])
        response.body = JSON.stringify(report)
      }
    });
  } catch (err) {
    console.log(err);
    response.statusCode = 400
  } finally {
    callback(null, response)
  }
}