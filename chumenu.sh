#!/bin/bash
cd /home/me/churchill/menu/menuscraper
source bin/activate
python scraper.py $(date +%d) $1
deactivate
