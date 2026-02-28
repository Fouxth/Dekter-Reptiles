import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const settings = await prisma.systemSetting.findUnique({
            where: { key: 'reset_time' }
        });
        const resetTime = settings?.value || '00:00';
        const [resetHour, resetMin] = resetTime.split(':').map(Number);

        const now = new Date();
        const today = new Date(now);

        // If current time is before the reset time, we are still "yesterday" operationally
        if (now.getHours() < resetHour || (now.getHours() === resetHour && now.getMinutes() < resetMin)) {
            today.setDate(today.getDate() - 1);
        }
        today.setHours(resetHour, resetMin, 0, 0);

        // Also adjust startOfMonth and startOfWeek based on the reset time rules
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        startOfMonth.setHours(resetHour, resetMin, 0, 0);

        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(resetHour, resetMin, 0, 0);

        const [totalSnakes, stockResult, lowStock, totalCategories, totalCustomers,
            todayOrders, weekOrders, monthOrders, totalOrdersCount, revenueResult,
            lastWeekOrders, categorySalesRaw, breedingSummaryRaw, dailyTasksRaw,
            geneticsRaw, overdueRaw, monthExpensesRaw] = await Promise.all([
                prisma.snake.count(),
                prisma.snake.aggregate({ _sum: { stock: true } }),
                prisma.snake.count({ where: { stock: { lt: 3, gt: 0 } } }),
                prisma.category.count(),
                prisma.customer.count(),
                prisma.order.findMany({
                    where: { createdAt: { gte: today }, status: 'completed' },
                    include: { items: true }
                }),
                prisma.order.findMany({
                    where: { createdAt: { gte: startOfWeek }, status: 'completed' },
                    include: { items: true }
                }),
                prisma.order.findMany({
                    where: { createdAt: { gte: startOfMonth }, status: 'completed' },
                    include: { items: true }
                }),
                prisma.order.count({ where: { status: 'completed' } }),
                prisma.order.aggregate({
                    where: { status: 'completed' },
                    _sum: { total: true, discount: true }
                }),
                // For growth comparison (last week)
                prisma.order.findMany({
                    where: {
                        createdAt: {
                            gte: new Date(startOfWeek.getTime() - 7 * 24 * 60 * 60 * 1000),
                            lt: startOfWeek
                        },
                        status: 'completed'
                    }
                }),
                // Category Sales
                prisma.orderItem.groupBy({
                    by: ['snakeId'],
                    _sum: { quantity: true, price: true },
                    where: { order: { status: 'completed' } }
                }),
                // Breeding Summary
                prisma.breedingRecord.findMany({
                    include: { female: { select: { name: true } }, male: { select: { name: true } } }
                }),
                // Daily Tasks (Health Records for today)
                prisma.healthRecord.findMany({
                    where: { recordDate: { gte: today } }
                }),
                // Genetics Distribution
                prisma.snake.groupBy({
                    by: ['genetics'],
                    _count: { id: true },
                    where: { stock: { gt: 0 } }
                }),
                // Overdue Feeding (Snakes not fed in 10+ days)
                prisma.snake.findMany({
                    where: { stock: { gt: 0 } },
                    include: {
                        healthRecords: {
                            where: { fed: true },
                            orderBy: { recordDate: 'desc' },
                            take: 1
                        }
                    }
                }),
                // Monthly Expenses
                prisma.expense.aggregate({
                    where: { date: { gte: startOfMonth } },
                    _sum: { amount: true }
                })
            ]);

        // Calculate Profit (Revenue - Cost from OrderItems)
        const todayRevenue = (todayOrders as any[]).reduce((s, o) => s + o.total, 0);
        const todayCost = (todayOrders as any[]).reduce((s, o) => s + o.items.reduce((si: any, i: any) => si + (i.cost * i.quantity), 0), 0);

        const weekRevenue = weekOrders.reduce((s, o) => s + o.total, 0);
        const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + o.total, 0);
        const growth = lastWeekRevenue > 0 ? ((weekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100 : 0;

        // Map Category Sales
        const snakeIds = categorySalesRaw.map(i => i.snakeId);
        const snakes = await prisma.snake.findMany({
            where: { id: { in: snakeIds } },
            include: { category: true }
        });

        const categoryMap: any = {};
        categorySalesRaw.forEach(item => {
            const snake = snakes.find(s => s.id === item.snakeId);
            const catName = snake?.category?.name || 'อื่นๆ';
            categoryMap[catName] = (categoryMap[catName] || 0) + (item._sum.price || 0);
        });
        const categorySales = Object.keys(categoryMap).map(name => ({ name, value: categoryMap[name] }));

        // Breeding & Incubation Summary
        const breedingSummary = {
            paired: breedingSummaryRaw.filter(b => !b.clutchDate).length,
            clutched: breedingSummaryRaw.filter(b => b.clutchDate && !b.offspringCount).length,
            hatchlings: breedingSummaryRaw.filter(b => b.offspringCount).length,
            incubation: breedingSummaryRaw
                .filter(b => b.clutchDate && !b.offspringCount)
                .map(b => ({
                    id: b.id,
                    female: b.female?.name,
                    clutchDate: b.clutchDate,
                    daysIncubated: b.clutchDate ? Math.floor((new Date().getTime() - new Date(b.clutchDate).getTime()) / (1000 * 60 * 60 * 24)) : 0
                }))
        };

        // Daily Tasks
        const dailyTasks = {
            fed: dailyTasksRaw.filter(t => t.fed).length,
            shed: dailyTasksRaw.filter(t => t.shed).length,
            total: dailyTasksRaw.length,
            handledSnakes: Array.from(new Set(dailyTasksRaw.map(t => t.snakeId))).length
        };

        // Process Overdue Feeding
        const tenDaysAgo = new Date();
        tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

        const overdueFeeding = (overdueRaw || [])
            .filter((s: any) => {
                const lastFed = s.healthRecords[0]?.recordDate;
                return !lastFed || new Date(lastFed) < tenDaysAgo;
            })
            .map((s: any) => ({
                id: s.id,
                name: s.name,
                lastFed: s.healthRecords[0]?.recordDate || s.createdAt
            }))
            .slice(0, 5);

        const geneticsDistMap = (geneticsRaw || []).map((g: any) => ({
            name: g.genetics || 'Normal',
            value: g._count.id
        })).sort((a: any, b: any) => b.value - a.value).slice(0, 6);

        // Month Financials
        const monthRevenue = monthOrders.reduce((s, o) => s + o.total, 0);
        const monthCost = (monthOrders as any[]).reduce((s, o) => s + o.items.reduce((si: any, i: any) => si + (i.cost * i.quantity), 0), 0);
        const monthExpenses = (monthExpensesRaw as any)._sum.amount || 0;

        res.json({
            totalSnakes,
            totalStock: stockResult._sum.stock || 0,
            lowStock,
            todaySales: todayRevenue,
            todayProfit: todayRevenue - todayCost,
            todayOrderCount: todayOrders.length,
            weekSales: weekRevenue,
            lastWeekSales: lastWeekRevenue,
            growth,
            monthSales: monthRevenue,
            monthCost,
            monthExpenses,
            monthNetProfit: monthRevenue - monthCost - monthExpenses,
            totalOrders: totalOrdersCount,
            totalRevenue: revenueResult._sum.total || 0,
            totalDiscount: revenueResult._sum.discount || 0,
            totalCategories,
            totalCustomers,
            categorySales,
            breedingSummary,
            dailyTasks,
            geneticStats: geneticsDistMap,
            overdueFeeding,
            lowStockList: await prisma.snake.findMany({
                where: { stock: { lt: 3, gt: 0 } },
                select: { id: true, name: true, stock: true },
                take: 5
            })
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// GET /api/dashboard/recent-orders
router.get('/recent-orders', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { snake: { select: { name: true } } } },
                customer: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
            },
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

// GET /api/dashboard/top-selling
router.get('/top-selling', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const topSelling = await prisma.orderItem.groupBy({
            by: ['snakeId'],
            _sum: { quantity: true, price: true },
            orderBy: { _sum: { quantity: 'desc' } },
            take: 8,
        });
        const snakeIds = topSelling.map(item => item.snakeId);
        const snakes = await prisma.snake.findMany({
            where: { id: { in: snakeIds } },
            include: { category: true },
        });
        const result = topSelling.map(item => {
            const snake = snakes.find(s => s.id === item.snakeId);
            return { ...snake, totalSold: item._sum.quantity ?? 0, totalRevenue: item._sum.price ?? 0 };
        });
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch top selling snakes' });
    }
});

// GET /api/dashboard/sales-chart?days=7|30
router.get('/sales-chart', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        // Fetch reset time
        const settings = await prisma.systemSetting.findUnique({
            where: { key: 'reset_time' }
        });
        const resetTime = settings?.value || '00:00';
        const [resetHour, resetMin] = resetTime.split(':').map(Number);

        const days = Math.min(Number(req.query.days) || 7, 30);
        const result = [];

        // Use current operational today as the anchor
        const now = new Date();
        const currentOpDay = new Date(now);
        if (now.getHours() < resetHour || (now.getHours() === resetHour && now.getMinutes() < resetMin)) {
            currentOpDay.setDate(currentOpDay.getDate() - 1);
        }
        currentOpDay.setHours(resetHour, resetMin, 0, 0);

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(currentOpDay);
            date.setDate(date.getDate() - i);
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const orders = await prisma.order.findMany({
                where: { createdAt: { gte: date, lt: nextDate }, status: 'completed' },
            });
            result.push({
                date: date.toISOString().split('T')[0],
                day: date.toLocaleDateString('th-TH', { weekday: 'short', day: 'numeric', month: 'short' }),
                short: date.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' }),
                sales: orders.reduce((s, o) => s + o.total, 0),
                orders: orders.length,
            });
        }
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch sales chart data' });
    }
});

// GET /api/dashboard/report?startDate=&endDate=
router.get('/report', authenticate, requireAdmin, async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { startDate, endDate } = req.query;
        const where: any = { status: 'completed' };
        if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(String(startDate)) };
        if (endDate) {
            const end = new Date(String(endDate));
            end.setHours(23, 59, 59, 999);
            where.createdAt = { ...where.createdAt, lte: end };
        }
        const orders = await prisma.order.findMany({
            where,
            include: {
                items: { include: { snake: { select: { name: true, category: { select: { name: true } } } } } },
                customer: { select: { name: true, phone: true } },
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
        const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
        const totalDiscount = orders.reduce((s, o) => s + (o.discount ?? 0), 0);
        const totalItems = orders.reduce((s, o) => s + o.items.reduce((si, i) => si + i.quantity, 0), 0);
        res.json({ orders, totalRevenue, totalDiscount, totalItems, orderCount: orders.length });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

export default router;
