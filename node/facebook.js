var config = require("config");
var request = require("request");

const
  APP_SECRET = config.get('appSecret'),
  VALIDATION_TOKEN = config.get('validationToken'),
  PAGE_ACCESS_TOKEN = config.get('pageAccessToken'),
  SERVER_URL = config.get('serverURL');

function textMessage(recipientId, messageText) {
  // A wrapper function for sending text messages - included for future expansion
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "Sent by Churchill Menus Messenger bot."
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  // From https://github.com/fbsamples/messenger-platform-samples
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (error || response.statusCode != 200) {
      console.error("Failed calling Send API", response.statusCode, response.statusMessage, body.error);
    }
  });
}

module.exports.textMessage = textMessage;
module.exports.callSendAPI = callSendAPI;
