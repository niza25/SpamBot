const express = require("express");
const bodyParser = require("body-parser");
const authRouter = require("./src/auth/routes");
const userRouter = require("./src/users/routes");
const cors = require("cors");

const classRouter = require("./src/classes/routes");
const questionRouter = require("./src/questions/routes");
const responseRouter = require("./src/responses/routes");
const studentRouter = require("./src/students/routes");

const app = express();
const port = process.env.PORT_DB || 4000;

app
  .use(cors())
  .use(bodyParser.json())
  .use(authRouter)
  .use(userRouter)
  .use(classRouter)
  .use(bodyParser.json({ limit: "1mb", extended: true }))
  .listen(port, () => console.log(`Listening on port ${port}`));

/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
         ______     ______     ______   __  __     __     ______
        /\  == \   /\  __ \   /\__  _\ /\ \/ /    /\ \   /\__  _\
        \ \  __<   \ \ \/\ \  \/_/\ \/ \ \  _"-.  \ \ \  \/_/\ \/
         \ \_____\  \ \_____\    \ \_\  \ \_\ \_\  \ \_\    \ \_\
          \/_____/   \/_____/     \/_/   \/_/\/_/   \/_/     \/_/


This is a sample Slack bot built with Botkit.

This bot demonstrates many of the core features of Botkit:

* Connect to Slack using the real time API
* Receive messages based on "spoken" patterns
* Reply to messages
* Use the conversation system to ask questions
* Use the built in storage system to store and retrieve information
for a user.

# RUN THE BOT:

Create a new app via the Slack Developer site:

  -> http://api.slack.com

Run your bot from the command line:

  clientId=<MY SLACK TOKEN> clientSecret=<my client secret> PORT=<3000> node bot.js

# USE THE BOT:

  Navigate to the built-in login page:

  https://<myhost.com>/login

  This will authenticate you with Slack.

  If successful, your bot will come online and greet you.


# EXTEND THE BOT:

Botkit has many features for building cool and useful bots!

Read all about it here:

  -> http://howdy.ai/botkit

~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
var env = require("node-env-file");
env(__dirname + "/.env");

if (!process.env.clientId || !process.env.clientSecret || !process.env.PORT) {
  usage_tip();
  // process.exit(1);
}

var Botkit = require("botkit");
var debug = require("debug")("botkit:main");

// Displaying cliendId is okay, but do not display secrets and tokens.
var bot_options = {
  clientId: process.env.clientId || "567388031410.571248244294",
  clientSecret: process.env.clientSecret || "f005018731987440abd1624afc805160",
  clientSigningSecret:
    process.env.clientSigningSecret || "108366d10010fce38b30a143a44fd408",
  // debug: true,
  scopes: ["bot"],
  studio_token: process.env.studio_token,
  studio_command_uri: process.env.studio_command_uri
};

// Use a mongo database if specified, otherwise store in a JSON file local to the app.
// Mongo is automatically configured when deploying to Heroku
if (process.env.MONGO_URI) {
  var mongoStorage = require("botkit-storage-mongo")({
    mongoUri: process.env.MONGO_URI
  });
  bot_options.storage = mongoStorage;
} else {
  bot_options.json_file_store = __dirname + "/happy-bot/data/db/"; // store user data in a simple JSON format
}

// Create the Botkit controller, which controls all instances of the bot.
var controller = Botkit.slackbot(bot_options);

controller.startTicking();

// Set up an Express-powered webserver to expose oauth and webhook endpoints
var webserver = require(__dirname +
  "/happy-bot/components/express_webserver.js")(controller);

if (!process.env.clientId || !process.env.clientSecret) {
  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + "/happy-bot/components/plugin_glitch.js")(controller);

  webserver.get("/", function(req, res) {
    res.render("installation", {
      domain: req.get("host"),
      protocol: req.protocol,
      glitch_domain: process.env.PROJECT_DOMAIN,
      layout: "layouts/default"
    });
  });

  var where_its_at =
    "http://" +
    (process.env.PROJECT_DOMAIN
      ? process.env.PROJECT_DOMAIN + ".glitch.me/"
      : "localhost:" + process.env.PORT_BOT || 3000);
  console.log(
    "WARNING: This application is not fully configured to work with Slack. Please see instructions at " +
      where_its_at
  );
} else {
  webserver.get("/", function(req, res) {
    res.render("index", {
      domain: req.get("host"),
      protocol: req.protocol,
      glitch_domain: process.env.PROJECT_DOMAIN,
      layout: "/happy-bot/layouts/default"
    });
  });
  // Set up a simple storage backend for keeping a record of customers
  // who sign up for the app via the oauth
  require(__dirname + "/happy-bot/components/user_registration.js")(controller);

  // Send an onboarding message when a new team joins
  require(__dirname + "/happy-bot/components/onboarding.js")(controller);

  // Load in some helpers that make running Botkit on Glitch.com better
  require(__dirname + "/happy-bot/components/plugin_glitch.js")(controller);

  var normalizedPath = require("path").join(__dirname, "happy-bot/skills");
  require("fs")
    .readdirSync(normalizedPath)
    .forEach(function(file) {
      require(__dirname + "/happy-bot/skills/" + file)(controller);
    });

  // This captures and evaluates any message sent to the bot as a DM
  // or sent to the bot in the form "@bot message" and passes it to
  // Botkit CMS to evaluate for trigger words and patterns.
  // If a trigger is matched, the conversation will automatically fire!
  // You can tie into the execution of the script using the functions
  // controller.studio.before, controller.studio.after and controller.studio.validate
  if (process.env.studio_token) {
    controller.on("direct_message,direct_mention,mention", function(
      bot,
      message
    ) {
      controller.studio
        .runTrigger(bot, message.text, message.user, message.channel, message)
        .then(function(convo) {
          if (!convo) {
            // no trigger was matched
            // If you want your bot to respond to every message,
            // define a 'fallback' script in Botkit CMS
            // and uncomment the line below.
            // controller.studio.run(bot, 'fallback', message.user, message.channel);
          } else {
            // set variables here that are needed for EVERY script
            // use controller.studio.before('script') to set variables specific to a script
            convo.setVar("current_time", new Date());
          }
        })
        .catch(function(err) {
          bot.reply(
            message,
            "I experienced an error with a request to Botkit CMS: " + err
          );
          debug("Botkit CMS: ", err);
        });
    });
  } else {
    console.log("~~~~~~~~~~");
    console.log("NOTE: Botkit CMS functionality has not been enabled");
    console.log("Learn mode https://github.com/howdyai/botkit-cms");
  }
}

function usage_tip() {
  console.log("~~~~~~~~~~");
  console.log("Botkit Starter Kit");
  console.log("Execute your bot application like this:");
  console.log(
    "clientId=<MY SLACK CLIENT ID> clientSecret=<MY CLIENT SECRET> PORT=3000 node bot.js"
  );
  console.log("Get Slack app credentials here: https://api.slack.com/apps");
  console.log("~~~~~~~~~~");
}
