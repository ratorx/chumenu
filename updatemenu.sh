#!/bin/bash
cd /home/me/churchill/menu/menuscraper
source bin/activate
python update.py $(date +%d)
deactivate
