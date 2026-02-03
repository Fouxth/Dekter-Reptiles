import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();

interface Order {
    id: number;
    total: number;
    status: string;
    createdAt: Date;
}

interface TopSellingItem {
    snakeId: number;
    _sum: { quantity: number | null };
}

// Get dashboard statistics
router.get('/stats', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        // Get date ranges
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());

        // Total snakes
        const totalSnakes = await prisma.snake.count();

        // Total stock
        const stockResult = await prisma.snake.aggregate({
            _sum: { stock: true },
        });
        const totalStock = stockResult._sum.stock || 0;

        // Low stock (less than 3)
        const lowStock = await prisma.snake.count({
            where: { stock: { lt: 3 } },
        });

        // Today's orders
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: today },
                status: 'completed',
            },
        });

        const todaySales = todayOrders.reduce((sum, order) => sum + order.total, 0);
        const todayOrderCount = todayOrders.length;

        // This week's sales
        const weekOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfWeek },
                status: 'completed',
            },
        });
        const weekSales = weekOrders.reduce((sum, order) => sum + order.total, 0);

        // This month's sales
        const monthOrders = await prisma.order.findMany({
            where: {
                createdAt: { gte: startOfMonth },
                status: 'completed',
            },
        });
        const monthSales = monthOrders.reduce((sum, order) => sum + order.total, 0);

        // Total orders
        const totalOrders = await prisma.order.count({
            where: { status: 'completed' },
        });

        // Total revenue
        const revenueResult = await prisma.order.aggregate({
            where: { status: 'completed' },
            _sum: { total: true },
        });
        const totalRevenue = revenueResult._sum.total || 0;

        // Categories count
        const totalCategories = await prisma.category.count();

        res.json({
            totalSnakes,
            totalStock,
            lowStock,
            todaySales,
            todayOrderCount,
            weekSales,
            monthSales,
            totalOrders,
            totalRevenue,
            totalCategories,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Get recent orders
router.get('/recent-orders', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { snake: { select: { name: true } } } },
            },
        });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

// Get top selling snakes
router.get('/top-selling', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        const topSelling = await prisma.orderItem.groupBy({
            by: ['snakeId'],
            _sum: { quantity: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 5,
        });

        const snakeIds = topSelling.map(item => item.snakeId);
        const snakes = await prisma.snake.findMany({
            where: { id: { in: snakeIds } },
            include: { category: true },
        });

        const result = topSelling.map(item => {
            const snake = snakes.find(s => s.id === item.snakeId);
            return {
                ...snake,
                totalSold: item._sum.quantity,
            };
        });

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch top selling snakes' });
    }
});

// Get sales chart data (last 7 days)
router.get('/sales-chart', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        const days = 7;
        const result = [];

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date();
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() - i);

            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const orders = await prisma.order.findMany({
                where: {
                    createdAt: { gte: date, lt: nextDate },
                    status: 'completed',
                },
            });

            const sales = orders.reduce((sum, order) => sum + order.total, 0);
            const count = orders.length;

            result.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('th-TH', { weekday: 'short' }),
                sales,
                orders: count,
            });
        }

        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch sales chart data' });
    }
});

export default router;
