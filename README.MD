# 🐍 Snake POS – ระบบจัดการร้านสัตว์เลื้อยคลาน (แบบใช้ร้านเดียว)

ระบบ Point-of-Sale และจัดการร้านค้าออนไลน์ครบวงจรสำหรับร้านสัตว์เลื้อยคลาน (งู) พัฒนาโดยใช้ React, Node.js, Express, Prisma และ PostgreSQL

---

## 📐 โครงสร้างโปรเจกต์

```
POS-Snake/
├── backend/        # Node.js + Express REST API
├── frontend/       # Admin Panel (React + Vite + Tailwind)
└── webpage/        # Customer-facing Store (React + Vite + Tailwind)
```

---

## 🛠️ Tech Stack

| Layer        | Technology                                        |
|--------------|---------------------------------------------------|
| **Database** | PostgreSQL + Prisma ORM                           |
| **Backend**  | Node.js, Express, TypeScript, JWT Auth, Multer    |
| **Admin UI** | React 18, Vite, Tailwind CSS v4, Lucide Icons     |
| **Shop UI**  | React 18, Vite, Tailwind CSS v4, PromptPay QR     |

---

## ✨ ฟีเจอร์หลัก

### 🏪 Admin Panel (`/frontend`)
| หน้า | รายละเอียด |
|------|-----------|
| **Dashboard** | ยอดขายวันนี้, จำนวนงูในสต็อก, รายได้รวม, กราฟสถิติ |
| **สินค้า (Inventory)** | จัดการงูและสินค้าทั่วไป, อัปโหลดรูปภาพแยกฝั่ง Admin/ลูกค้า |
| **หมวดหมู่** | สร้าง/แก้ไข/ลบหมวดหมู่สินค้า |
| **ออร์เดอร์** | ดูและจัดการคำสั่งซื้อ, อัปเดตสถานะ, ใส่เลข Tracking |
| **ลูกค้า** | ดูรายชื่อและประวัติการสั่งซื้อของลูกค้า |
| **ผสมพันธุ์** | บันทึกและติดตามการผสมพันธุ์งู |
| **ฟักไข่** | บันทึกการฟักไข่ ตั้งแต่วันเข้าฟักจนถึงวันฟักสำเร็จ |
| **ค่าใช้จ่าย** | บันทึกค่าใช้จ่ายร้าน (หนูแช่แข็ง, อุปกรณ์ ฯลฯ) |
| **รายงาน** | รายงานรายได้, กำไรขั้นต้น, กำไรสุทธิ (หักค่าใช้จ่าย) |
| **พนักงาน** | จัดการบัญชีผู้ใช้งาน (Admin/Staff) |
| **ตั้งค่า** | ตั้งค่าร้าน, ช่องทางชำระเงิน, บัญชีธนาคาร, PromptPay |

### 🛒 Customer Store (`/webpage`)
| หน้า | รายละเอียด |
|------|-----------|
| **หน้าแรก** | แสดงสินค้าแนะนำ, งูมาใหม่ |
| **ร้านค้า** | แสดงสินค้าทั้งหมดพร้อมฟิลเตอร์หมวดหมู่ |
| **หน้าสินค้า** | รายละเอียดสินค้า, ข้อมูลงู (สายพันธุ์, Morph, เพศ) |
| **ตะกร้า** | สรุปสินค้า, เลือกวิธีชำระเงิน (เงินสด/โอน/QR), นับถอยหลัง QR |
| **Checkout Success** | แสดง QR Code PromptPay + นับถอยหลัง, อัปโหลดสลิป |
| **บัญชีลูกค้า** | สมัครสมาชิก/เข้าสู่ระบบ, ประวัติออร์เดอร์ |

---

## 💳 ระบบชำระเงิน

- **เงินสด** (Cash on Delivery)
- **โอนเงินธนาคาร** – แสดงเลขบัญชีและชื่อธนาคารพร้อมไอคอนสี
- **PromptPay QR** – สร้าง QR ด้วย `promptpay-qr`, มีตัวนับถอยหลัง, หมดแล้วปิด QR อัตโนมัติ
- **QR Expiry** – ตั้งได้ในหน้าตั้งค่า (นาที)

---

## 🚀 วิธีติดตั้งและรัน

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- npm

### 1. Clone โปรเจกต์
```bash
git clone <repo-url> POS-Snake
cd POS-Snake
```

### 2. ตั้งค่า Backend
```bash
cd backend
cp .env.example .env  # แก้ไข DATABASE_URL, JWT_SECRET
npm install
npx prisma db push
npx prisma db seed
npm run dev           # รันที่ http://localhost:5000
```

### 3. ตั้งค่า Admin Panel
```bash
cd frontend
npm install
# สร้างไฟล์ .env
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev           # รันที่ http://localhost:5173
```

### 4. ตั้งค่า Customer Store
```bash
cd webpage
npm install
# สร้างไฟล์ .env
echo "VITE_API_URL=http://localhost:5000/api" > .env
npm run dev           # รันที่ http://localhost:5174
```

---

## ⚙️ Environment Variables

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/snakepos"
JWT_SECRET="your-super-secret-key"
PORT=5000
```

### Frontend / Webpage (`.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 📦 API Endpoints สำคัญ

| Method | Endpoint                        | รายละเอียด                    |
|--------|---------------------------------|-------------------------------|
| POST   | `/api/auth/login`               | เข้าสู่ระบบ Admin             |
| GET    | `/api/snakes`                   | ดึงรายการสินค้าทั้งหมด        |
| POST   | `/api/orders`                   | สร้างออร์เดอร์ใหม่            |
| POST   | `/api/orders/:id/slip`          | อัปโหลดสลิปการชำระเงิน        |
| GET    | `/api/settings`                 | ดึงการตั้งค่าระบบ             |
| PUT    | `/api/settings`                 | อัปเดตการตั้งค่าระบบ          |
| GET    | `/api/reports`                  | รายงานรายได้และกำไร           |
| POST   | `/api/upload`                   | อัปโหลดรูปภาพสินค้า           |

---

## 🗂️ โครงสร้างฐานข้อมูล (หลัก)

```
User          – ผู้ใช้งาน Admin/Staff
Customer      – สมาชิกลูกค้า
Category      – หมวดหมู่สินค้า
Snake         – สินค้า (งู หรือสินค้าทั่วไป)
Order         – ออร์เดอร์
OrderItem     – รายการในออร์เดอร์
BreedingRecord – บันทึกการผสมพันธุ์
IncubationRecord – บันทึกการฟักไข่
HealthRecord  – บันทึกสุขภาพงู
FeedingLog    – บันทึกการให้อาหาร
StockLog      – ประวัติการเปลี่ยนแปลงสต็อก
Expense       – ค่าใช้จ่ายร้าน
SystemSetting – การตั้งค่าระบบ (key-value)
```

---

## 📁 โครงสร้างไฟล์สำคัญ

```
backend/src/
├── index.ts              # Express app + routes
├── middleware/           # Auth middleware
└── ...

frontend/src/
├── pages/                # Admin pages (Dashboard, Inventory, Settings...)
├── components/           # Layout, BankBadge, ImageUpload, ConfirmModal...
└── context/              # AuthContext

webpage/src/
├── pages/                # Shop pages (Home, Store, Cart, CheckoutSuccess...)
├── components/           # Navbar, Footer, ProductCard, BankBadge...
├── contexts/             # CustomerAuthContext
└── services/             # api.js
```

---

## 🏦 ธนาคารที่รองรับ

K-Bank · SCB · BBL · KTB · BAY · ttb · GSB · BAAC · UOB · CIMB · TISCO · KKP · LH Bank

ไอคอนธนาคารแสดงเป็นสีประจำแต่ละธนาคาร ไม่พึ่งพา CDN ภายนอก

---

## 📝 License

Private project — Dexter Reptiles © 2025-2026
