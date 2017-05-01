#! /usr/bin/python3
"""
This provides the data to be delivered to the messenger bot users. This
script is run with a cron job on the server before the meal times. It
makes a POST request to the server, which will in turn send the provided
data as a message.
TODO: Implement remaining methods
TODO: Add security key to verify whether the POST request is being made
by this script and not a malicious attacker.

Plans for future:
    Add ability to request menu in the app at any time and get the data
    then. Could consider updating the data separately and then fetching
    from JSON - however, this might have concurrency issues.
"""
import json
from sys import argv

from bs4 import BeautifulSoup
import requests as req

CONFIG_FILE = "../node/config/default.json"
MENU_URL = "https://www.chu.cam.ac.uk/student-hub/catering/menus/"
MAX_RETRIES = 5


def get_table():

    r = None
    for _ in range(MAX_RETRIES):
        r = req.get(MENU_URL)
        if r.status_code == req.codes.ok:
            break
    r.raise_for_status()

    soup = BeautifulSoup(r.text, "html.parser")
    div_class = "medium-8 small-centered columns content-container"
    return soup.find("div", class_=div_class).table


def parse_list(menu):

    if menu is None:
        return post_processing(None)

    items = menu.findAll("li")

    # No data
    if len(items) == 0:
        return post_processing(None)

    items[:] = [item.string for item in items]

    # Empty list as data
    if items[0] == "\xa0":
        return None

    return post_processing(items)


def post_processing(items):

    if items is None:
        return ["TBC"]
    # Remove random chars from the end
    for i, item in enumerate(items):
        if not item[-1].isalpha() and not item[-1] in [")"]:
            items[i] = item[:-1]

    return items


def get_menu(day, time, table=None, menus=None):
    """
    table: BeautifulSoup table object
    day: day of the week (1-7) (in accordance with linux date)
    time: lunch or dinner (0 or 1)
    """
    if menus is not None:
        if day == 0:
            return None
        try:
            return menus[day-1][time]
        except IndexError:
            return None

    if table is None:
        table = get_table()

    row = None
    try:
        row = table.findAll("tr")[day]
    except IndexError:
        return None

    menu = None
    try:
        menu = row.findAll("td")[time + 1]
    except IndexError:
        return None

    return parse_list(menu)


def get_all_menus(table=None):
    """
    Similar to get_menu, but returns all the menus
    """
    if table is None:
        table = get_table()

    rows = table.findAll("tr")
    menus = list()

    for i in range(1, len(rows)):
        day_menus = [parse_list(m) for m in rows[i].findAll("td")[1:]]
        menus.append(day_menus)

    return menus


def post_message(args):
    # TODO: Redo to take into account new get_menu method
    # Make post request to node server to send menu data
    menu = get_menu(int(args[1]), int(args[2]))

    with open(CONFIG_FILE, encoding="utf8") as f:
        cfg = json.load(f)

    payload = {"validationToken": cfg["validationToken"], "menu": menu}
    if args[2] == "1":
        payload["meal"] = "Dinner"
    else:
        payload["meal"] = "Lunch"

    r = req.post("{}:{}/sendall".format(cfg["serverURL"], cfg["port"]),
                 json=payload)
    r.raise_for_status()

if __name__ == "__main__":
    post_message(argv)
