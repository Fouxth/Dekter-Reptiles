# Dexter-Reptiles

## ระดับของโปรเจกต์
โปรเจกต์นี้อยู่ในระดับ **กลางถึงสูง (Intermediate to Advanced)** เหมาะสำหรับธุรกิจขนาดเล็กถึงกลางที่ต้องการระบบบริหารจัดการร้านขายสัตว์เลื้อยคลาน (Reptile Shop) ครอบคลุมทั้งฝั่งหน้าร้าน (POS), ระบบหลังบ้าน (Back Office) และเว็บไซต์สำหรับลูกค้า

## โครงสร้างโปรเจกต์
- **backend/** : ระบบฝั่งเซิร์ฟเวอร์ (Node.js + Prisma + Express)
  - จัดการข้อมูลสินค้า, ลูกค้า, ออเดอร์, การเพาะพันธุ์, สุขภาพ, รายจ่าย ฯลฯ
  - มีระบบ Auth, Socket, อัปโหลดไฟล์, และเชื่อมต่อฐานข้อมูลผ่าน Prisma
- **frontend/** : เว็บแอปสำหรับผู้ดูแลร้าน (React + Vite)
  - ใช้งานสำหรับจัดการข้อมูล, ดูรายงาน, จัดการสต็อก, ออเดอร์, ลูกค้า ฯลฯ
- **webpage/** : เว็บไซต์หน้าบ้านสำหรับลูกค้า (React + Vite)
  - ลูกค้าสามารถดูสินค้า, สมัครสมาชิก, สั่งซื้อ, ดูบทความ ฯลฯ

## การทำงานโดยรวม
1. **Backend**
   - ให้บริการ API สำหรับ frontend และ webpage
   - จัดการข้อมูลหลัก เช่น สินค้า, ลูกค้า, ออเดอร์, การเพาะพันธุ์, สุขภาพ ฯลฯ
   - มีระบบ Auth, อัปโหลดไฟล์, และ WebSocket สำหรับการแจ้งเตือนแบบเรียลไทม์
2. **Frontend**
   - ผู้ดูแลร้านล็อกอินเพื่อจัดการข้อมูลต่าง ๆ ผ่าน UI ที่ใช้งานง่าย
## การติดตั้งและเริ่มต้นใช้งาน (แบบละเอียด)

ขั้นตอนย่อ:

1) ติดตั้ง dependencies สำหรับทั้ง 3 โปรเจกต์ (backend, frontend, webpage)

```bash
cd backend
npm install

cd ../frontend
npm install

cd ../webpage
npm install
```

2) ตั้งค่า environment variables ใน `backend/.env` (ตัวอย่างด้านล่าง)

3) เตรียมฐานข้อมูลและรัน migration (Prisma)

```bash
cd backend
npx prisma migrate dev --name init
npx prisma db seed
```

4) รันโปรเจกต์ในโหมดพัฒนา

```bash
cd backend && npm run dev
cd ../frontend && npm run dev
cd ../webpage && npm run dev
```

หมายเหตุ: สคริปต์จริง (`dev`, `start`) อยู่ในแต่ละ `package.json` — ตรวจสอบไฟล์เหล่านั้นหากคำสั่งข้างต้นไม่ทำงาน

---

## ตัวอย่าง `backend/.env` (ตัวอย่างค่า placeholder)

```env
DATABASE_URL="postgresql://dxv4th:xxxxxx@localhost:5432/snake_pos"
JWT_SECRET="snake-pxs"
PORT=5000
```

---

## โครงสร้างโฟลเดอร์ (อธิบายละเอียด)

- `backend/`:
   - `package.json` : สคริปต์สำหรับรัน/บิวด์/มิเกรท
   - `tsconfig.json` : การตั้งค่า TypeScript
   - `prisma/` : `schema.prisma`, migrations, seed.ts
   - `src/index.ts` : entry point ของเซิร์ฟเวอร์
   - `src/socket.ts` : การตั้งค่า WebSocket / socket.io
   - `src/middleware/` : middleware (auth, file upload handlers)
   - `src/routes/` : แยกตาม domain (auth, snakes, customers, orders, settings, ฯลฯ)
   - `uploads/` : เก็บไฟล์ที่อัพโหลด เช่น สลิปหรือรูปสินค้า

- `frontend/`:
   - `src/main.jsx` : entry point ของ admin frontend
   - `src/pages/` : หน้าแอปสำหรับผู้ดูแล (Dashboard, POS, Inventory, Orders)
   - `src/components/` : คอมโพเนนท์ที่ใช้ร่วมกัน

- `webpage/`:
   - เว็บไซต์สำหรับลูกค้า มีหน้า Shop, Articles, ProductDetail, Cart

---

## API (ภาพรวม — ต้องการให้ผมเจาะลึกแยก endpoint ไหม)
ไฟล์ route หลักอยู่ที่ `backend/src/routes/` ประกอบด้วย endpoints สำคัญดังตัวอย่าง:

- `POST /api/auth/login` — ลงชื่อเข้าใช้
- `GET /api/snakes` — ดึงรายการสินค้า
- `POST /api/orders` — สร้างออเดอร์ใหม่
- `GET /api/customers/:id` — ข้อมูลลูกค้า

ถ้าต้องการผมสามารถสแกน `backend/src/routes` และสร้างเอกสาร endpoint (request/response examples) ให้แบบอัตโนมัติ

---

## การรันใน production (ข้อเสนอแนะ)
- ใช้ process manager เช่น `pm2` หรือ containerize ด้วย Docker
- ย้าย `uploads/` ไปยัง object storage (S3) สำหรับความทนทาน
- ตั้งค่า CORS และ rate-limiting สำหรับ API

---

## การทดสอบและ CI/CD
- เพิ่ม unit และ integration tests (Jest / Supertest)
- ตั้ง GitHub Actions หรือ pipeline ให้รัน `lint`, `test`, `prisma migrate` และ deploy อัตโนมัติ

---

## ถัดไป — ตัวเลือกที่ผมช่วยได้เพิ่มเติม
- สร้างเอกสาร API อัตโนมัติจาก route files
- สร้างตัวอย่าง `.env.production` และสคริปต์ deploy
- ทำ checklist สำหรับ deploy บน Heroku/Vercel/AWS

บอกผมได้เลยว่าต้องการให้ผมทำต่อส่วนไหน: "API docs", "ตรวจ schema Prisma", "สร้างตัวอย่าง deploy" หรืออื่น ๆ ครับ

---

## API Reference (สรุป endpoints หลัก)
Base path: `/api` (ตรวจสอบการ mount ใน `backend/src/index.ts`)

- **Auth (ผู้ดูแล)**
   - `POST /api/auth/login` — เข้าสู่ระบบ (รับ token)
   - `GET /api/auth/me` — ข้อมูลผู้ใช้ปัจจุบัน (ต้องมี token)

- **Customer Auth (ลูกค้า)**
   - `POST /api/customer-auth/register` — ลงทะเบียนลูกค้า
   - `POST /api/customer-auth/login` — ลูกค้าเข้าสู่ระบบ
   - `GET /api/customer-auth/me` — ข้อมูลลูกค้าที่ล็อกอิน (token)
   - `GET /api/customer-auth/orders` — ประวัติออเดอร์ของลูกค้า (token)

- **Users (admin)**
   - `PATCH /api/users/profile` — อัปเดตโปรไฟล์ผู้ใช้ปัจจุบัน
   - `GET /api/users` — ดึงรายชื่อผู้ใช้ (admin)
   - `POST /api/users` — สร้างผู้ใช้ใหม่ (admin)
   - `PUT /api/users/:id` — แก้ไขผู้ใช้ (admin)
   - `DELETE /api/users/:id` — ลบผู้ใช้ (admin)

- **Snakes (สินค้า)**
   - `GET /api/snakes` — ดึงรายการสินค้า (รองรับ filter/search)
   - `GET /api/snakes/:id` — ดึงข้อมูลสินค้ารายตัว
   - `POST /api/snakes` — สร้างสินค้า (admin)
   - `POST /api/snakes/bulk` — สร้างสินค้ากลุ่ม (admin)
   - `PUT /api/snakes/:id` — แก้ไขสินค้า (admin)
   - `POST /api/snakes/upload` — อัปโหลดรูปภาพสินค้า (admin)
   - `DELETE /api/snakes/:id` — ลบสินค้า (admin, มีเงื่อนไข)

- **Categories**
   - `GET /api/categories` — ดึงหมวดหมู่
   - `GET /api/categories/:id` — ดึงหมวดหมู่เฉพาะ
   - `POST /api/categories` — สร้างหมวดหมู่ (admin)
   - `PUT /api/categories/:id` — แก้ไขหมวดหมู่ (admin)
   - `DELETE /api/categories/:id` — ลบหมวดหมู่ (admin)

- **Orders**
   - `GET /api/orders` — ดึงรายการออเดอร์ (admin)
   - `GET /api/orders/:id` — ดูออเดอร์เดียว
   - `POST /api/orders` — สร้างออเดอร์ (checkout)
   - (มีการจัดการ slip upload และ token สำหรับอัปโหลดสลิป — ดู `backend/src/routes/orders.ts` สำหรับรายละเอียด)

- **Stock Logs**
   - `GET /api/stock-logs` — ดูประวัติการเปลี่ยนแปลงสต็อก
   - `POST /api/stock-logs` — ปรับสต็อก (manual)

- **Feeding Logs**
   - `GET /api/feeding-logs` — ดูประวัติการให้อาหาร
   - `POST /api/feeding-logs` — บันทึกการให้อาหาร
   - `DELETE /api/feeding-logs/:id` — ลบบันทึก

- **Health Records**
   - `GET /api/health-records` — ดูบันทึกสุขภาพ
   - `POST /api/health-records` — สร้างบันทึกสุขภาพ
   - `PUT /api/health-records/:id` — แก้ไขบันทึก
   - `DELETE /api/health-records/:id` — ลบบันทึก

- **Breeding & Incubation**
   - `GET /api/breeding-records` — ดึงประวัติการเพาะพันธุ์
   - `POST /api/breeding-records` — สร้างบันทึกการเพาะพันธุ์
   - `PUT /api/breeding-records/:id` — แก้ไข
   - `DELETE /api/breeding-records/:id` — ลบ
   - `GET /api/incubation-records` — ดึงบันทึกการฟักไข่
   - `POST /api/incubation-records` — สร้างบันทึกการฟัก
   - `PUT /api/incubation-records/:id` — แก้ไข
   - `DELETE /api/incubation-records/:id` — ลบ

- **Expenses**
   - `GET /api/expenses` — ดูรายจ่าย (filter by month/year)
   - `POST /api/expenses` — บันทึกรายจ่าย
   - `PUT /api/expenses/:id` — แก้ไข
   - `DELETE /api/expenses/:id` — ลบ

- **Settings & Admin Utilities**
   - `GET /api/settings` — ดึงค่าระบบ
   - `PATCH /api/settings` — อัปเดตหลายค่า (admin)
   - `POST /api/settings` — สร้าง/อัปเดต setting เดียว (admin)
   - `GET /api/settings/backup` — ดาวน์โหลด backup JSON (admin)
   - `DELETE /api/settings/reset` — ล้างข้อมูล (preserve users & settings) (admin)

- **Dashboard**
   - `GET /api/dashboard/stats` — สรุปสถิติ (admin)
   - `GET /api/dashboard/recent-orders` — ออเดอร์ล่าสุด (admin)
   - `GET /api/dashboard/top-selling` — สินค้าขายดี (admin)
   - `GET /api/dashboard/sales-chart` — ข้อมูลกราฟยอดขาย
   - `GET /api/dashboard/report` — สร้างรายงานช่วงวันที่

หมายเหตุ: แต่ละ endpoint อาจต้องการการ authenticated token และบาง endpoint ต้องการสิทธิ์ `admin` — ตรวจสอบ middleware `backend/src/middleware/auth.ts` สำหรับกฎการตรวจสอบ

---

## Backend scripts (จาก `backend/package.json`)
- `npm run dev` — รันเซิร์ฟเวอร์ในโหมดพัฒนา (`tsx watch src/index.ts`)
- `npm run build` — คอมไพล์ TypeScript ไปยัง `dist/` (`tsc`)
- `npm start` — รันไฟล์ `dist/index.js` สำหรับ production
- `npm run prisma:generate` — รัน `prisma generate`
- `npm run prisma:push` — รัน `prisma db push`
- `npm run prisma:studio` — เปิด `prisma studio`
- `npm run seed` — รัน `tsx prisma/seed.ts` เพื่อ seed ข้อมูล

---

## Frontend & Webpage — การตั้งค่าและการรัน (ละเอียด)

ทั้ง `frontend/` (admin) และ `webpage/` (customer site) ใช้ React + Vite

1) ติดตั้ง dependencies (ซ้ำเตือน):

```bash
cd frontend
npm install

cd ../webpage
npm install
```

2) ตัวแปรแวดล้อม (frontend):
- `VITE_API_URL` — URL ของ backend API เช่น `http://localhost:5000/api`
- สร้างไฟล์ `.env.local` ในแต่ละโฟลเดอร์ถ้าจำเป็น

3) รันในโหมดพัฒนา:

```bash
cd frontend && npm run dev
cd ../webpage && npm run dev
```

4) สร้าง production build:

```bash
cd frontend && npm run build
cd ../webpage && npm run build
```

5) การ deploy:
- สามารถ deploy build output ไปยัง Vercel/Netlify หรือ serve ผ่าน CDN
- ตรวจสอบ `VITE_API_URL` ให้ชี้ไปยัง backend ที่ deploy แล้ว

---

## ตัวอย่างไฟล์ environment สำหรับ `backend` (`backend/.env.example`)
ไฟล์ตัวอย่างถูกสร้างใน repository ที่ `backend/.env.example` — ใช้เป็น template ก่อนใส่ค่าจริงใน `.env`

---

**ผู้พัฒนา:** Dexter-Reptiles ; Dev4TH
**เทคโนโลยี:** Node.js, Express, Prisma, React, Vite, Socket.io, ฯลฯ
