#! /usr/bin/python3
from datetime import datetime
import sys

import api
import scraper


@api.message_base
def default():
    return "Command not recognised. Type help for list of available commands."


@api.message_base
def menu(day, time):
    return scraper.get_menu(int(day), int(time))


@api.message_base
def lunch():
    day = datetime.today().isoweekday()
    time = datetime.now()
    time = (time.hour, time.minute)

    prefix = "Today's Lunch:"

    # Set to tomorrow after lunch ends
    if time[0] > 13 or (time[0] == 13 and time[1] > 45):
        day %= 7
        day += 1
        prefix = "Tomorrow's Lunch:"

    return prefix + scraper.get_menu(day, 0)


@api.message_base
def dinner():
    day = datetime.today().isoweekday()
    time = datetime.now()
    time = (time.hour, time.minute)

    prefix = "Today's Dinner:"

    # Set to tomorrow after dinner ends
    if time[0] > 19 or (time[0] == 19 and time[1] > 15):
        day %= 7
        day += 1
        prefix = "Tomorrow's Dinner:"

    return prefix + scraper.get_menu(day, 1)


@api.message_base
def help_message():
    return "Type subscribe to get menu alerts.\nType unsubscribe to stop getting menu alerts.\nType lunch to get the next lunch menu.\nType dinner to get the next dinner menu."


MENU_FUNCTIONS = {
    "*help": help_message,
    "default": default,
    "*dinner": dinner,
    "*lunch": lunch,
    "*menu": menu
}


if __name__ == "__main__":
    api.parse_function(sys.argv, MENU_FUNCTIONS)
