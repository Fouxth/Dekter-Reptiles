import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create admin user
    const adminHash = await bcrypt.hash('admin1234', 10);
    const staffHash = await bcrypt.hash('staff1234', 10);

    await prisma.user.createMany({
        data: [
            { email: 'admin@snakestore.com', passwordHash: adminHash, name: 'Admin', role: 'admin' },
            { email: 'staff@snakestore.com', passwordHash: staffHash, name: 'Staff 1', role: 'staff' },
        ],
    });
    console.log('✅ Created 2 users');

    // Create categories
    const categories = await Promise.all([
        prisma.category.create({ data: { name: 'งูเหลือม (Python)', description: 'งูเหลือมหลากหลายสายพันธุ์ ขนาดใหญ่ สีสวยงาม', image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400' } }),
        prisma.category.create({ data: { name: 'งูคอร์น (Corn Snake)', description: 'งูคอร์น สีสันสดใส เลี้ยงง่าย เหมาะสำหรับมือใหม่', image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400' } }),
        prisma.category.create({ data: { name: 'งูบอล (Ball Python)', description: 'งูบอลพิธอน นิสัยเชื่อง ขนาดกลาง มีหลายสีหลายลาย', image: 'https://images.unsplash.com/photo-1585095595205-2a0b64d6c530?w=400' } }),
        prisma.category.create({ data: { name: 'งูหางกระดิ่ง (Hognose)', description: 'งูหางกระดิ่ง น่ารัก ปากเชิดขึ้น นิสัยตลก', image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400' } }),
    ]);
    console.log(`✅ Created ${categories.length} categories`);

    // Create snakes (use dateOfBirth instead of age)
    const now = new Date();
    const dob = (months: number) => new Date(now.getFullYear(), now.getMonth() - months, now.getDate());

    const snakes = await Promise.all([
        // Ball Pythons
        prisma.snake.create({ data: { name: 'Ball Python - Pastel', description: 'งูบอลพิธอน มอร์ฟ Pastel สีเหลืองทองสวยงาม', price: 3500, cost: 1500, stock: 5, color: 'เหลืองทอง', genetics: 'Pastel', dateOfBirth: dob(6), gender: 'male', categoryId: categories[2].id, image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400' } }),
        prisma.snake.create({ data: { name: 'Ball Python - Albino', description: 'งูบอลพิธอน อัลบิโน สีขาวเหลือง ตาแดง สวยหายาก', price: 8500, cost: 4000, stock: 2, color: 'ขาว-เหลือง', genetics: 'Albino', dateOfBirth: dob(12), gender: 'female', categoryId: categories[2].id, image: 'https://images.unsplash.com/photo-1585095595205-2a0b64d6c530?w=400' } }),
        prisma.snake.create({ data: { name: 'Ball Python - Piebald', description: 'งูบอลพิธอน ไพบอล ลายขาวสลับสี หายากมาก', price: 25000, cost: 12000, stock: 1, color: 'ขาว-น้ำตาล', genetics: 'Piebald', dateOfBirth: dob(24), gender: 'female', categoryId: categories[2].id, image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400' } }),
        // Corn Snakes
        prisma.snake.create({ data: { name: 'Corn Snake - Amelanistic', description: 'งูคอร์น อะเมลานิสติก สีส้มแดงสด ไม่มีสีดำ', price: 2500, cost: 800, stock: 8, color: 'ส้ม-แดง', genetics: 'Amelanistic', dateOfBirth: dob(4), gender: 'male', categoryId: categories[1].id, image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400' } }),
        prisma.snake.create({ data: { name: 'Corn Snake - Anerythristic', description: 'งูคอร์น อะเนอริธริสติก สีเทาดำ สง่างาม', price: 2800, cost: 900, stock: 4, color: 'เทา-ดำ', genetics: 'Anerythristic', dateOfBirth: dob(8), gender: 'female', categoryId: categories[1].id, image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400' } }),
        prisma.snake.create({ data: { name: 'Corn Snake - Snow', description: 'งูคอร์น สโนว์ สีขาวอมชมพู หายากสวยมาก', price: 4500, cost: 1500, stock: 3, color: 'ขาว-ชมพู', genetics: 'Snow (Amel + Anery)', dateOfBirth: dob(6), gender: 'male', categoryId: categories[1].id, image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400' } }),
        // Pythons
        prisma.snake.create({ data: { name: 'Reticulated Python - Normal', description: 'งูเหลือมลายสวย ขนาดใหญ่ สีน้ำตาลทอง', price: 5000, cost: 2000, stock: 2, color: 'น้ำตาล-ทอง', dateOfBirth: dob(18), gender: 'male', categoryId: categories[0].id, image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400' } }),
        prisma.snake.create({ data: { name: 'Reticulated Python - Super Dwarf', description: 'งูเหลือมขนาดเล็กพิเศษ เลี้ยงง่ายกว่าปกติ', price: 15000, cost: 7000, stock: 1, color: 'เหลือง-ดำ', dateOfBirth: dob(24), gender: 'female', categoryId: categories[0].id, image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400' } }),
        // Hognose
        prisma.snake.create({ data: { name: 'Western Hognose - Normal', description: 'งูหางกระดิ่งตะวันตก นิสัยน่ารัก ปากเชิดขึ้น', price: 6500, cost: 3000, stock: 3, color: 'น้ำตาล-เหลือง', dateOfBirth: dob(10), gender: 'female', categoryId: categories[3].id, image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400' } }),
        prisma.snake.create({ data: { name: 'Western Hognose - Albino', description: 'งูหางกระดิ่งอัลบิโน สีสันสดใส หายากมาก', price: 12000, cost: 5500, stock: 1, color: 'ส้ม-ขาว', genetics: 'Albino', dateOfBirth: dob(12), gender: 'male', categoryId: categories[3].id, image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400' } }),
    ]);
    console.log(`✅ Created ${snakes.length} snakes`);

    // Sample customers
    await prisma.customer.createMany({
        data: [
            { name: 'สมชาย ใจดี', phone: '081-234-5678', lineId: 'somchai99' },
            { name: 'สุดา มีสุข', phone: '091-876-5432' },
        ],
    });
    console.log('✅ Created 2 customers');

    // Create sample orders
    const admin = await prisma.user.findFirst({ where: { role: 'admin' } });
    await prisma.order.create({
        data: {
            subtotal: 6000, discount: 0, tax: 0, total: 6000,
            status: 'completed', paymentMethod: 'cash',
            userId: admin?.id,
            items: { create: [{ snakeId: snakes[0].id, quantity: 1, price: 3500, cost: 1500 }, { snakeId: snakes[3].id, quantity: 1, price: 2500, cost: 800 }] },
        },
    });
    await prisma.order.create({
        data: {
            subtotal: 8500, discount: 500, tax: 0, total: 8000,
            status: 'completed', paymentMethod: 'transfer',
            userId: admin?.id,
            items: { create: [{ snakeId: snakes[1].id, quantity: 1, price: 8500, cost: 4000 }] },
        },
    });
    console.log('✅ Created 2 sample orders');
    console.log('🎉 Seeding completed!');
    console.log('');
    console.log('👤 Admin login: admin@snakestore.com / admin1234');
    console.log('👤 Staff login: staff@snakestore.com / staff1234');
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });
