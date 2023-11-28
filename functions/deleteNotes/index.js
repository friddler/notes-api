const { sendResponse } = require("../../responses/index");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const { nanoid } = require("nanoid");
const middy = require('@middy/core');
const { validateToken } = require("../middleware/auth");
const jwt = require('jsonwebtoken');