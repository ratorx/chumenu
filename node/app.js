const
  api = require('./facebook');
  bodyParser = require('body-parser'),
  config = require('config'),
  express = require('express'),
  fs = require('fs'),
  https = require('https'),
  // request = require('request'),
  schedule = require('node-schedule'),
  spawn = require('child_process').spawn,
  path = require('path');

process.title = "chumenutest";

// These values should be set in config/default.json
const
  VALIDATION_TOKEN = config.get('validationToken'),
  PORT = config.get('port'),
  KEY = fs.readFileSync(config.get("key")),
  CERT = fs.readFileSync(config.get("cert")),
  CA = fs.readFileSync(config.get("ca")),
  CREDS = {
    key: KEY,
    cert: CERT,
    ca: CA
  },
  USER_FILE = path.join(__dirname, config.get("users")),
  MENU_SCRIPT = path.join(__dirname, config.get("menu"));

if (!(VALIDATION_TOKEN && PORT && KEY && CERT && CA && USER_FILE)) {
  console.log("Set the appropriate config values in config/default.json");
  process.exit(1);
};

// Server variable initialisation
var app = express();
var users = JSON.parse(fs.readFileSync(USER_FILE, "utf8"));

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

app.get("/privacy", function(req, res) {
  res.sendFile(path.join(__dirname, "public/main.html"));
})

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
    console.log("Unsupported action attempted.")
  }
  res.sendStatus(200);
});

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
    default:
      var python_script = spawn("python3", [MENU_SCRIPT, event.message.text, event.sender.id]);
      python_script.stdout.on("data", function (data) {
        console.log(event.message.text + " " + event.sender.id + " " + data.toString());
      })
  }
}

var lunch = schedule.scheduleJob("40 11 * * *", function(){
  var lunch_script = spawn("python3", [MENU_SCRIPT, "lunch", recipients_string(users)]);
  lunch_script.stdout.on("data", function (data) {
    console.log("lunch" + " " + "subscribers" + " " + data.toString());
  });
});

var dinner = schedule.scheduleJob("17 15 * * *", function(){
  var dinner_script = spawn("python3", [MENU_SCRIPT, "dinner", recipients_string(users)]);
  dinner_script.stdout.on("data", function (data) {
    console.log("dinner" + " " + "subscribers" + " " + data.toString());
  });
});

function recipients_string(user_file) {
  return Object.keys(user_file).join(" ");
}
