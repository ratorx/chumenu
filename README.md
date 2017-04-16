# Churchill College Menu Bot
Facebook Messenger bot which sends the hall menu for lunch and dinner at Churchill College.

[Link to Facebook page](https://www.facebook.com/churchillmenu "Churchill Menus")

**Note:** App has not yet been submitted for approval to be an official messenger bot, due to forms which need to be filled. If you want to be a tester (and be able to use the bot), contact [Reeto Chatterjee](https://www.facebook.com/reetoc "Reeto Chatterjee") on Facebook.

## Supported commands
These commands can be sent as messages to the Facebook page linked above.

* **subscribe** - Subscribes the user to receive bi-daily menu messages. The current timings are 11:40 for the lunch menu and 17:00 for the dinner menu.
* **unsubscribe** - Unsubscribes the user from above.
* **lunch** - Displays current/next lunch menu.
* **dinner** - Displays current/next dinner menu.
* **help** - Repeats above info

## Docs
The code itself is easy to understand. However, the integration of node and python might require more explanation. The server which processes and sends messages is written in node. The web scraping is done in python. The scraped data is sent to the server by making a post request from the python script to the appropriate URL. The server then deals with the data.

## Development
If you want more keywords, drop me a message and I'll see what I can do. In the spirit of open source, feel free send a pull request.

### TODO:
* Improve reliability of server
* Improve integration with python to allow message keywords to be declared in python
* Add more keywords
* Add rating system with messaging_postbacks
