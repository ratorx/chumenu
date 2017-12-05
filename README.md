# Churchill College Menu Bot
Facebook Messenger bot which sends the hall menu for lunch and dinner at Churchill College.

[Link to Facebook page](https://www.facebook.com/churchillmenus "Churchill Menus")

**UPDATE**: This version of chumenu is no longer developed. It will be replaced by a shinier [Go version](https://www.github.com/ratorx/chumenu-go) some time in the future. I will only be fixing serious bugs for now.

## Supported commands
These commands can be sent as messages to the Facebook page linked above.

* **subscribe** - Subscribes the user to receive bi-daily menu messages. The current timings are 11:40 for the lunch menu and 17:00 for the dinner menu.
* **unsubscribe** - Unsubscribes the user from above.
* **lunch** - Displays current/next lunch menu.
* **dinner** - Displays current/next dinner menu.
* **help** - Repeats above info

## Docs
The node server handles the webhook verification. Also it receives the messaging notifications from Facebook. This is then passed as an argument to a python script which sends a POST request to the Facebook API. The keywords can be defined inside the menus.py dictionary. A decorator for sending a post request with the correct format for the message is included in api.py. Node-schedule handles sending the lunch & dinner menus at the appropriate times.

## Development
If you want more keywords, drop me a message and I'll see what I can do. In the spirit of open source, feel free send a pull request.

### TODO:
* Improve reliability of server
* Add more keywords
* Add rating system with messaging_postbacks
