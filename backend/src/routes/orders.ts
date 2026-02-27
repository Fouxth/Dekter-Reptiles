import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { slipUpload } from '../middleware/slipUpload';
import { getIO } from '../socket';

const router = Router();

interface OrderItemInput {
    snakeId: number;
    quantity: number;
    price?: number;
}

// Get all orders
router.get('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { status, startDate, endDate } = req.query;

        const orders = await prisma.order.findMany({
            where: {
                ...(status && { status: String(status) }),
                ...(startDate && endDate && {
                    createdAt: {
                        gte: new Date(String(startDate)),
                        lte: new Date(String(endDate)),
                    },
                }),
            },
            include: {
                items: {
                    include: { snake: true },
                },
                user: { select: { id: true, name: true } },
                customer: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get single order
router.get('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const order = await prisma.order.findUnique({
            where: { id: Number(req.params.id) },
            include: {
                items: { include: { snake: true } },
                user: { select: { id: true, name: true } },
                customer: true,
            },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// Create order (checkout)
router.post('/', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { items, paymentMethod, note, userId, discount, customerId, shippingAddress } = req.body;

        // items: [{ snakeId: number, quantity: number }]
        if (!items || !items.length) {
            return res.status(400).json({ error: 'Order must have at least one item' });
        }

        // Calculate total and validate stock
        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const snake = await prisma.snake.findUnique({
                where: { id: item.snakeId },
            });

            if (!snake) {
                return res.status(400).json({ error: `Snake with ID ${item.snakeId} not found` });
            }

            if (snake.stock < item.quantity) {
                return res.status(400).json({ error: `Insufficient stock for ${snake.name}` });
            }

            total += snake.price * item.quantity;
            orderItems.push({
                snakeId: snake.id,
                quantity: item.quantity,
                price: snake.price,
                cost: snake.cost ?? 0,
            });
        }

        // Fetch settings for orderNo prefix, VAT, and Sales Target
        const settings = await prisma.systemSetting.findMany({
            where: {
                key: { in: ['receipt_prefix', 'enable_vat', 'tax_rate', 'daily_target', 'notify_sales_target', 'reset_time'] }
            }
        });
        const getSetting = (k: string, fb: string) => settings.find(s => s.key === k)?.value || fb;

        const prefix = getSetting('receipt_prefix', 'POS');
        const enableVat = getSetting('enable_vat', 'false') === 'true';
        const taxRate = parseFloat(getSetting('tax_rate', '7')) || 7;
        const dailyTarget = parseFloat(getSetting('daily_target', '0')) || 0;
        const notifySalesTargetSetting = getSetting('notify_sales_target', 'false') === 'true';
        const resetTime = getSetting('reset_time', '00:00');

        // Generate Order No (e.g., POS-20231025-00001)
        const today = new Date();
        const yyyymmdd = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Find latest order for today to increment running number
        const latestOrder = await prisma.order.findFirst({
            where: {
                orderNo: { startsWith: `${prefix}-${yyyymmdd}-` }
            },
            orderBy: { orderNo: 'desc' },
            select: { orderNo: true }
        });

        let nextNum = 1;
        if (latestOrder) {
            const lastPart = latestOrder.orderNo.split('-').pop();
            if (lastPart && !isNaN(Number(lastPart))) {
                nextNum = parseInt(lastPart, 10) + 1;
            }
        }

        const orderNo = `${prefix}-${yyyymmdd}-${String(nextNum).padStart(5, '0')}`;

        const discountAmount = Number(discount) || 0;

        // Calculate tax - Exclusive (add on top of subtotal)
        const currentTotal = total - discountAmount;
        const tax = enableVat ? (currentTotal * taxRate) / 100 : 0;
        const finalTotal = currentTotal + tax;

        // Create order and update stock in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    orderNo,
                    subtotal: total,
                    discount: discountAmount,
                    tax: tax,
                    total: finalTotal,
                    paymentMethod: paymentMethod || 'cash',
                    status: paymentMethod === 'transfer' ? 'pending_payment' : 'completed',
                    note,
                    shippingAddress,
                    ...(userId ? { user: { connect: { id: Number(userId) } } } : {}),
                    ...(customerId ? { customer: { connect: { id: Number(customerId) } } } : {}),
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: { include: { snake: true } },
                    customer: true,
                    user: { select: { id: true, name: true } },
                },
            });

            // Update stock
            for (const item of items) {
                await tx.snake.update({
                    where: { id: item.snakeId },
                    data: { stock: { decrement: item.quantity } },
                });
            }

            return newOrder;
        });

        // Check for sales target reach
        if (notifySalesTargetSetting && dailyTarget > 0) {
            try {
                const [resetHour, resetMin] = resetTime.split(':').map(Number);
                const now = new Date();
                const cycleStart = new Date(now);
                if (now.getHours() < resetHour || (now.getHours() === resetHour && now.getMinutes() < resetMin)) {
                    cycleStart.setDate(cycleStart.getDate() - 1);
                }
                cycleStart.setHours(resetHour, resetMin, 0, 0);

                const todaysSales = await prisma.order.aggregate({
                    where: {
                        createdAt: { gte: cycleStart },
                        status: 'completed'
                    },
                    _sum: { total: true }
                });

                const totalSalesForToday = todaysSales._sum.total || 0;

                // If this order pushed it over the limit
                if (totalSalesForToday >= dailyTarget && (totalSalesForToday - order.total) < dailyTarget) {
                    getIO().emit('sales_target_reached', {
                        target: dailyTarget,
                        total: totalSalesForToday,
                    });
                }
            } catch (err) {
                console.error('Target check failed:', err);
            }
        }

        // Emit socket event for new order
        try {
            getIO().emit('new_order', {
                orderId: order.id,
                orderNo: order.orderNo,
                total: order.total,
                status: order.status,
                itemCount: order.items.length,
                paymentMethod: order.paymentMethod,
            });
        } catch (_) { }

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Upload payment slip
router.post('/:id/slip', slipUpload.single('slip'), async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const orderId = Number(req.params.id);

        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a slip image' });
        }

        const slipUrl = `/uploads/slips/${req.file.filename}`;

        const order = await prisma.order.update({
            where: { id: orderId },
            data: {
                paymentSlip: slipUrl,
                status: 'awaiting_verification'
            }
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload slip' });
    }
});

// Update tracking number
router.patch('/:id/tracking', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { trackingNo } = req.body;

        const order = await prisma.order.update({
            where: { id: Number(req.params.id) },
            data: {
                trackingNo,
                status: 'shipping'
            }
        });

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update tracking number' });
    }
});

// Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { status } = req.body;

        // Get current order for previousStatus
        const currentOrder = await prisma.order.findUnique({
            where: { id: Number(req.params.id) },
            select: { status: true, orderNo: true },
        });

        const order = await prisma.order.update({
            where: { id: Number(req.params.id) },
            data: { status },
            include: { items: { include: { snake: true } } },
        });

        // Emit socket event for status change
        try {
            getIO().emit('order_status_changed', {
                orderId: order.id,
                orderNo: order.orderNo,
                status: order.status,
                previousStatus: currentOrder?.status,
            });
        } catch (_) { }

        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update order' });
    }
});

// Cancel order (restore stock)
router.delete('/:id', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;

        const order = await prisma.order.findUnique({
            where: { id: Number(req.params.id) },
            include: { items: true },
        });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        // Restore stock and delete order
        await prisma.$transaction(async (tx) => {
            for (const item of order.items) {
                await tx.snake.update({
                    where: { id: item.snakeId },
                    data: { stock: { increment: item.quantity } },
                });
            }

            await tx.order.delete({
                where: { id: order.id },
            });
        });

        res.json({ message: 'Order cancelled and stock restored' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel order' });
    }
});

export default router;
