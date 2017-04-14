cwd=$(pwd)
cd /home/me/churchill/menu/menuscraper
source bin/activate
python update.py $(date +%u) $(date +%R)
deactivate
cd $cwd
