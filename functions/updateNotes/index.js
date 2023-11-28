const { sendResponse } = require("../../responses/index");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../middleware/auth");

const maxTitleLength = 50;
const maxTextLength = 300;

const updateNotes = async (event, context) => {
  if (event?.error && event?.error === "401") {
    return sendResponse(401, { success: false, message: "Invalid token" });
  }

  const requestBody = JSON.parse(event.body);
  const { id, title, text } = requestBody;

  if (!id || !title || !text) {
    return sendResponse(400, {
      success: false,
      message: "Note ID, title, and text are required",
    });
  }

  if (title.length > maxTitleLength || text.length > maxTextLength) {
    return sendResponse(400, {
        success: false,
        message: `Title cannot be more than ${maxTitleLength} characters and text cannot be more than ${maxTextLength} characters`
    });
}

  const modifiedAt = new Date().toISOString();

  try {
    const updateResult = await db
      .update({
        TableName: "notes-db",
        Key: { id: id },
        ReturnValues: "ALL_NEW",
        UpdateExpression:
          "set #title = :title, #text = :text, #modifiedAt = :modifiedAt",
        ExpressionAttributeValues: {
          ":title": title,
          ":text": text,
          ":modifiedAt": modifiedAt,
        },
        ExpressionAttributeNames: {
          "#title": "title",
          "#text": "text",
          "#modifiedAt": "modifiedAt",
        },
      })
      .promise();

    return sendResponse(200, {
      success: true,
      updatedNote: updateResult.Attributes,
    });
  } catch (error) {
    return sendResponse(500, {
      success: false,
      message: "Could not update note",
    });
  }
};

const handler = middy(updateNotes).use(validateToken);

module.exports = { handler };
