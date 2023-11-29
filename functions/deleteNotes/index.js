const { sendResponse } = require("../../responses/index");
const AWS = require("aws-sdk");
const db = new AWS.DynamoDB.DocumentClient();
const middy = require("@middy/core");
const { validateToken } = require("../middleware/auth");

const deleteNote = async (event, context) => {
  if (event?.error && event.error === "401") {
    return sendResponse(401, { success: false, message: "Invalid token" });
  }

  const requestBody = JSON.parse(event.body);
  const noteId = requestBody.id;
  const userName = event.username;

  if (!noteId) {
    return sendResponse(400, {
      success: false,
      message: "Note ID is required",
    });
  }

  try {
    const noteData = await db
      .get({
        TableName: "notes-db",
        Key: { id: noteId },
      })
      .promise();

    if (!noteData.Item || noteData.Item.username !== userName) {
      return sendResponse(403, {
        success: false,
        message: "Access failed or note not found",
      });
    }

    await db
      .delete({
        TableName: "notes-db",
        Key: { id: noteId },
      })
      .promise();

    return sendResponse(200, {
      success: true,
      message: "Note successfully deleted",
    });
  } catch (error) {
    console.error("Error deleting note:", error);
    return sendResponse(500, {
      success: false,
      message: "Failed to delete note",
    });
  }
};

const handler = middy(deleteNote).use(validateToken);

module.exports = { handler };
