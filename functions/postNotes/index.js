const { sendResponse } = require("../../responses/index");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const { nanoid } = require("nanoid");
const middy = require('@middy/core');
const { validateToken } = require("../middleware/auth");

const maxTitleLength = 50;
const maxTextLength = 300;

const postNotes = async (event, context) => {
  if (event?.error && event?.error === "401")
    return sendResponse(401, {
      success: false,
      message: "Invalid token. Try again.",
    });

  const note = JSON.parse(event.body);

  if (!note.title || !note.text) {
    return sendResponse(400, {
      success: false,
      message: "Title and text are required",
    });
  }

  if (note.title.length > maxTitleLength || note.text.length > maxTextLength) {
    return sendResponse(400, {
      success: false,
      message: `Title cannot be more than ${maxTitleLength} characters and text cant be more than ${maxTextLength} characters`,
    });
  }

  const createdAt = new Date().toISOString;
  note.id = nanoid();
  note.createdAt = `${createdAt}`;
  note.modifiedAt = createdAt;
  note.username = event.username;

  try {
    await db
      .put({
        TableName: "notes-db",
        Item: note,
      })
      .promise();

    return sendResponse(200, { success: true, note });
  } catch (error) {
    return sendResponse(500, { success: false, message: "Internal server error" });
  }
};

const handler = middy(postNotes).use(validateToken);

module.exports = { handler };
