const
  bodyParser = require('body-parser'),
  config = require('config'),
  express = require('express'),
  fs = require('fs'),
  https = require('https');
  request = require('request');
  path = require('path');
  api = require('./facebook');

// These values should be set in config/default.json
const
  VALIDATION_TOKEN = config.get('validationToken'),
  PORT = config.get('port')
  KEY = fs.readFileSync(config.get("key")),
  CERT = fs.readFileSync(config.get("cert")),
  CA = fs.readFileSync(config.get("ca"))
  CREDS = {
    key: KEY,
    cert: CERT,
    ca: CA
  },
  USER_FILE = config.get("users"),
  MENU_FILE = config.get("menu");

if (!(VALIDATION_TOKEN && PORT && KEY && CERT && CA && USER_FILE)) {
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

// Server initialisation
const server = https.createServer(CREDS, app).listen(PORT, function(err) {
  if (err) {
    return console.log("Something went wrong.");
  }

  console.log(`Listening on port ${PORT}`);
});

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
// From https://github.com/fbsamples/messenger-platform-samples
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

// Hook for sending messages to all subscribers
app.post('/sendall', function(req, res) {
  var data = req.body;
  var message = data.meal + ":";
  if (data.validationToken === VALIDATION_TOKEN) {
    // Deal with implicit array to string of size 1 array
    constructMessage(data.menu);
    // Message subscribers
    for(var id in users) {
      api.textMessage(id, message);
    }
    res.sendStatus(200);
  } else {
    res.error("Invalid validation token.");
    res.sendStatus(403);
  }
})

// Hook for updating stored menu
app.post('/updatemenu', function(req, res) {
  // console.log("Updating menu");
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

// Parse received message - TODO: Make it more modular to match cases
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
          api.textMessage(event.sender.id, "You have been subscribed to receive menu messages.");
        });
      } else {
        api.textMessage(event.sender.id, "You are already subscribed.");
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
          api.textMessage(event.sender.id, "You have been unsubscribed from receiving menu messages.");
        });
      } else {
        api.textMessage(event.sender.id, "You are not currently subscribed to receive menu messages.");
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
      api.textMessage(event.sender.id, "Type subscribe to get menu alerts.\nType unsubscribe to stop getting menu alerts.\nType lunch to get the next lunch menu.\nType dinner to get the next dinner menu.");
    default:
      // api.textMessage(event.sender.id, "Unrecognised. Supported operations are subscribe and unsubscribe.");
      break;
  }
}

// Send menu message on request
function menuMessage(mealname, id) {
  var message = mealname + ":";
  var meal = menu[mealname];
  message += constructMessage(meal)
  api.textMessage(id, message);
}

function constructMessage(menuinfo) {
  var message = ""
  if (!menuinfo) message = "\n - TBC";
  else if (typeof menuinfo === "string") message += "\n -  " + menuinfo;
  else menuinfo.forEach( (item) => message += "\n -  " + item);
  return message;
}
