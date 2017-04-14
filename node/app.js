
const
  bodyParser = require('body-parser'),
  config = require('config'),
  express = require('express'),
  fs = require('fs'),
  https = require('https');
  request = require('request');
  path = require('path');

// These values should be set in config/default.json
const
  APP_SECRET = config.get('appSecret'),
  VALIDATION_TOKEN = config.get('validationToken'),
  PAGE_ACCESS_TOKEN = config.get('pageAccessToken'),
  SERVER_URL = config.get('serverURL');
  PORT = config.get('port')
  KEY = fs.readFileSync(config.get("key")),
  CERT = fs.readFileSync(config.get("cert")),
  CA = fs.readFileSync(config.get("ca"))
  CREDS = {
    key: KEY,
    cert: CERT,
    ca: CA
  },
  USER_FILE = (process.argv[2] == "test") ? config.get("testusers") : config.get("users"),
  MENU_FILE = config.get("menu");

if (!(APP_SECRET && VALIDATION_TOKEN && PAGE_ACCESS_TOKEN && SERVER_URL && PORT && KEY && CERT && CA && USER_FILE)) {
  console.error("Set the appropriate config values in config/default.json");
  process.exit(1);
};

// Server variable initialisation
var app = express();
var users = JSON.parse(fs.readFileSync(USER_FILE, "utf8"));
var menu = JSON.parse(fs.readFileSync(MENU_FILE, "utf8"));

// Basic Express set-up
app.set("port", PORT);
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(express.static("public"))

// Webhook Verification
app.get("/webhook", function(req, res) {
  // console.log("Incoming request");
  if (req.query["hub.mode"] === "subscribe" &&
      req.query["hub.verify_token"] === VALIDATION_TOKEN){
    // console.log("Validating webhook");
    res.status(200).end(req.query["hub.challenge"]);
  } else {
    res.error("Invalid validation token.");
    res.sendStatus(403);
  }
});

// Callback from Facebook
app.post('/webhook', function (req, res) {
  var data = req.body;

  if (data.object === "page") {
    data.entry.forEach(function(pageEntry) {
      pageEntry.messaging.forEach(function(messagingEvent) {
        if (messagingEvent.message) {
          // Handle various messages
          receivedMessage(messagingEvent);
        }
      });
    });
  } else {
    // Nothing else is currently supported
    console.error("Unsupported action attempted.")
  }
  res.sendStatus(200);
});

app.post('/sendall', function(req, res) {
  var data = req.body;
  var message = data.meal + ":";
  if (data.validationToken === VALIDATION_TOKEN) {
    // Deal with implicit array to string of size 1 array
    if (typeof data.menu === "string") {
      message += "\n -  " + data.menu;
    } else {
      data.menu.forEach( (item) => message += "\n -  " + item);
    }
    // Message subscribers
    for(var id in users) {
      textMessage(id, message);
    }
    res.sendStatus(200);
  } else {
    res.error("Invalid validation token.");
    res.sendStatus(403);
  }
})

app.post('/updatemenu', function(req, res) {
  var data = req.body;
  if (data.validationToken === VALIDATION_TOKEN) {
    (function(callback) {
          if (data.menu) {
            menu = data.menu;
          }
          callback();
        })(function() {
          fs.writeFileSync(MENU_FILE, JSON.stringify(menu));
        });
    res.sendStatus(200);
  } else {
    res.error("Invalid validation token.");
    res.sendStatus(403);
  }
})

function receivedMessage(event) {
  // Handle different cases - currently only text messages supported.
  switch (event.message.text) {
    case "subscribe":
    case "Subscribe":
      if (!users[event.sender.id]) {

        (function(callback) {
          users[event.sender.id] = true;
          callback();
        })(function() {
          fs.writeFileSync(USER_FILE, JSON.stringify(users));
          textMessage(event.sender.id, "You have been subscribed to receive menu messages.");
        });
      } else {
        textMessage(event.sender.id, "You are already subscribed.");
      }
      break;
    case "unsubscribe":
    case "Unsubscribe":
      if (users[event.sender.id]) {
        (function(callback) {
          delete users[event.sender.id];
          callback();
        })(function() {
          fs.writeFileSync(USER_FILE, JSON.stringify(users));
          textMessage(event.sender.id, "You have been unsubscribed from receiving menu messages.");
        });
      } else {
        textMessage(event.sender.id, "You are not currently subscribed to receive menu messages.");
      }
      break;
    case "lunch":
      menuMessage("Lunch", event.sender.id);
      break;
    case "dinner":
      menuMessage("Dinner", event.sender.id);
      break;
    case "Lunch":
    case "Dinner":
      menuMessage(event.message.text, event.sender.id);
      break;
    case "help":
    case "Help":
      textMessage(event.sender.id, "Type subscribe to get menu alerts.\nType unsubscribe to stop getting menu alerts.\nType lunch to get today's lunch.\nType dinner to get today's dinner.");
    default:
      // textMessage(event.sender.id, "Unrecognised. Supported operations are subscribe and unsubscribe.");
      break;
  }
}

function textMessage(recipientId, messageText) {
  // A wrapper function for sending text messages - included for future expansion
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText,
      metadata: "Hello"
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  // Generic send function courtesy of https://github.com/fbsamples/messenger-platform-samples
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

function menuMessage(mealname, id) {
  var message = mealname + ":";
  var meal = menu[mealname];
  if (!meal) {
    message = "No data available."
  } else if (typeof meal === "string") {
    message += "\n -  " + meal;
  } else {
    meal.forEach( (item) => message += "\n -  " + item);
  }
  textMessage(id, message);
}


const server = https.createServer(CREDS, app).listen(PORT, function(err) {
  if (err) {
    return console.log("Something went wrong.");
  }

  console.log(`Listening on port ${PORT}`);
});
