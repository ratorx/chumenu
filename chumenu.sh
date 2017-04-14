cwd=$(pwd)
cd /home/me/churchill/menu/menuscraper
source bin/activate
python scraper.py $(date +%u) $1
deactivate
cd $cwd
