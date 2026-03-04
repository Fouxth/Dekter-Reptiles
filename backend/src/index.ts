import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import { initIO } from './socket';

// Routes
import snakeRoutes from './routes/snakes';
import categoryRoutes from './routes/categories';
import orderRoutes from './routes/orders';
import dashboardRoutes from './routes/dashboard';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import customerRoutes from './routes/customers';
import stockLogRoutes from './routes/stock-logs';
import healthRecordRoutes from './routes/health-records';
import breedingRecordRoutes from './routes/breeding-records';
import settingRoutes from './routes/settings';
import feedingLogRoutes from './routes/feeding-logs';
import incubationRecordRoutes from './routes/incubation-records';
import customerAuthRoutes from './routes/customer-auth';
import expenseRoutes from './routes/expenses';
import notificationRoutes from './routes/notifications';
import articlesRouter from './routes/articles';
import expenseCategoryRoutes from './routes/expenseCategories';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Initialize Socket.io
const io = initIO(httpServer);

// CORS Configuration
// 1. ดึงค่าจาก .env ออกมาเป็น Array (ถ้าไม่มีให้เป็น Array ว่าง)
const envWebUrls = process.env.WEB_URL ? process.env.WEB_URL.split(',') : [];

// 2. รวมค่าทั้งหมดเข้าด้วยกัน
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://43.229.149.151:5173',
    'http://43.229.149.151:5174',
    'http://43.229.149.151',
    'https://admin-dexter.vercel.app',
    'https://dexterball.com',
    'https://www.dexterball.com',
    'https://dekter-reptiles-landingpage.vercel.app',
].concat(envWebUrls);

// ใช้ Set เพื่อกรองตัวซ้ำ (กรณีที่ใน .env กับที่เขียนไว้ตรงกัน)
const uniqueOrigins = Array.from(new Set(allowedOrigins));

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);

        // Check if origin is explicitly allowed or is a Vercel subdomain
        const isAllowed = uniqueOrigins.indexOf(origin) !== -1 ||
            origin.endsWith('.vercel.app') ||
            origin.includes('43.229.149.151') ||
            origin.includes('localhost') ||
            origin.includes('127.0.0.1');

        if (isAllowed) {
            return callback(null, true);
        } else {
            console.log('🚫 CORS Rejected Origin:', origin);
            const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
            return callback(new Error(msg), false);
        }
    },
    credentials: true
}));
app.set('trust proxy', 2); // Trust first proxy (e.g., Cloudflare)
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Make prisma and io available in request
app.use((req, res, next) => {
    (req as any).prisma = prisma;
    (req as any).io = io;
    next();
});

// Public routes
app.use('/api/auth', authRoutes);
app.use('/api/customer-auth', customerAuthRoutes);

// Protected routes (auth applied per-route or globally)
app.use('/api/snakes', snakeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/stock-logs', stockLogRoutes);
app.use('/api/health-records', healthRecordRoutes);
app.use('/api/breeding-records', breedingRecordRoutes);
app.use('/api/settings', settingRoutes);
app.use('/api/feeding-logs', feedingLogRoutes);
app.use('/api/incubation-records', incubationRecordRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/articles', articlesRouter);
app.use('/api/expense-categories', expenseCategoryRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server (use httpServer, NOT app.listen)
httpServer.listen(PORT, () => {
    console.log(`🐍 Snake POS API running on http://localhost:${PORT}`);
    console.log(`🔔 Socket.io ready`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
