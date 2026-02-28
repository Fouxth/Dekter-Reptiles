@echo off
title DEXTER-BACKEND-PM2-MONITOR
cd /d C:\Users\Administrator\Desktop\Dexter-Reptiles\backend

:: 1. ตรวจสอบและติดตั้ง pm2-log-server (ถ้ายังไม่มี)
echo Checking for Log Server...
call npm list -g pm2-log-server || npm install -g pm2-log-server

:: 2. สั่ง Build โค้ด
echo Building project...
call npm run build

:: 3. สั่งรัน Backend ผ่าน PM2
call pm2 start dist/index.js --name "dekter-backend"

:: 4. สั่งรัน Log Server ที่พอร์ต 4254 (รันแบบเบื้องหลัง)
start "Log-Viewer" cmd /c "pm2-log-server 4254"

echo --------------------------------------------------
echo Backend is RUNNING!
echo VIEW LOGS AT: http://localhost:4254
echo --------------------------------------------------
echo Press Ctrl+C twice or close this window to STOP ALL.
echo --------------------------------------------------

:: 5. แสดง Log ในหน้าต่างนี้ด้วย
call pm2 logs dekter-backend

:: 6. เมื่อสั่งหยุด ให้ปิดทั้ง Backend และ Log Server
echo Stopping all services...
call pm2 stop dekter-backend log-view
call pm2 delete dekter-backend log-view

pause