import json
from sys import argv

import requests

import scraper

with open(scraper.CONFIG_FILE, encoding="utf8") as f:
    cfg = json.load(f)

table = scraper.get_table()

l = int(argv[1])
d = int(argv[1])
time = [int(t) for t in argv[2].split(":")]

if time[0] > 13 or (time[0] == 13 and time[1] > 45):
    l %= 7
    l += 1
if time[0] > 19 or (time[0] == 19 and time[1] > 15):
    d %= 7
    d += 1

menu = {"Lunch": scraper.get_menu(l, 0, table),
        "Dinner": scraper.get_menu(d, 1, table)}

payload = {"validationToken": cfg["validationToken"], "menu": menu}

r = requests.post("{}:{}/updatemenu".format(cfg["serverURL"], cfg["port"]),
                  json=payload)

r.raise_for_status()
