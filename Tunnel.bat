@echo off
:: ตั้งชื่อหน้าต่าง CMD
title CLOUDFLARE-TUNNEL-DEKTER
echo --------------------------------------------------
echo Starting Cloudflare Tunnel for Backend (Port 5000)
echo --------------------------------------------------

:: สั่งรัน Cloudflare Tunnel ไปที่พอร์ต 5000
:: ตรวจสอบว่าไฟล์อยู่ใน C:\cloudflared\ และชื่อไฟล์ถูกต้อง
C:\cloudflared\cloudflared.exe tunnel --url http://localhost:5000

pause