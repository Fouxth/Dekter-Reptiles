import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';

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
        const { items, paymentMethod, note, userId, discount, customerId } = req.body;

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

        const discountAmount = Number(discount) || 0;
        // Create order and update stock in transaction
        const order = await prisma.$transaction(async (tx) => {
            // Create order
            const newOrder = await tx.order.create({
                data: {
                    subtotal: total,
                    discount: discountAmount,
                    tax: 0,
                    total: total - discountAmount,
                    paymentMethod: paymentMethod || 'cash',
                    note,
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

        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// Update order status
router.patch('/:id/status', async (req: Request, res: Response) => {
    try {
        const prisma: PrismaClient = (req as any).prisma;
        const { status } = req.body;

        const order = await prisma.order.update({
            where: { id: Number(req.params.id) },
            data: { status },
            include: { items: { include: { snake: true } } },
        });

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
