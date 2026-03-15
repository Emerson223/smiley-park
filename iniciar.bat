@echo off
cd "C:\Users\MANGABEIRA\Desktop\projeto 01"
pm2 start server.js --name "smiley-park" -f
pm2 start backup.js --name "smiley-backup" -f
pm2 save
echo Smiley Park iniciado!
pause