import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Create categories
    const categories = await Promise.all([
        prisma.category.create({
            data: {
                name: 'งูเหลือม (Python)',
                description: 'งูเหลือมหลากหลายสายพันธุ์ ขนาดใหญ่ สีสวยงาม',
                image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400',
            },
        }),
        prisma.category.create({
            data: {
                name: 'งูคอร์น (Corn Snake)',
                description: 'งูคอร์น สีสันสดใส เลี้ยงง่าย เหมาะสำหรับมือใหม่',
                image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400',
            },
        }),
        prisma.category.create({
            data: {
                name: 'งูบอล (Ball Python)',
                description: 'งูบอลพิธอน นิสัยเชื่อง ขนาดกลาง มีหลายสีหลายลาย',
                image: 'https://images.unsplash.com/photo-1585095595205-2a0b64d6c530?w=400',
            },
        }),
        prisma.category.create({
            data: {
                name: 'งูหางกระดิ่ง (Hognose)',
                description: 'งูหางกระดิ่ง น่ารัก ปากเชิดขึ้น นิสัยตลก',
                image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
            },
        }),
    ]);

    console.log(`✅ Created ${categories.length} categories`);

    // Create snakes
    const snakes = await Promise.all([
        // Ball Pythons
        prisma.snake.create({
            data: {
                name: 'Ball Python - Pastel',
                description: 'งูบอลพิธอน มอร์ฟ Pastel สีเหลืองทองสวยงาม',
                price: 3500,
                stock: 5,
                color: 'เหลืองทอง',
                age: '6 เดือน',
                gender: 'male',
                categoryId: categories[2].id,
                image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Ball Python - Albino',
                description: 'งูบอลพิธอน อัลบิโน สีขาวเหลือง ตาแดง สวยหายาก',
                price: 8500,
                stock: 2,
                color: 'ขาว-เหลือง',
                age: '1 ปี',
                gender: 'female',
                categoryId: categories[2].id,
                image: 'https://images.unsplash.com/photo-1585095595205-2a0b64d6c530?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Ball Python - Piebald',
                description: 'งูบอลพิธอน ไพบอล ลายขาวสลับสี หายากมาก',
                price: 25000,
                stock: 1,
                color: 'ขาว-น้ำตาล',
                age: '2 ปี',
                gender: 'female',
                categoryId: categories[2].id,
                image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400',
            },
        }),
        // Corn Snakes
        prisma.snake.create({
            data: {
                name: 'Corn Snake - Amelanistic',
                description: 'งูคอร์น อะเมลานิสติก สีส้มแดงสด ไม่มีสีดำ',
                price: 2500,
                stock: 8,
                color: 'ส้ม-แดง',
                age: '4 เดือน',
                gender: 'male',
                categoryId: categories[1].id,
                image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Corn Snake - Anerythristic',
                description: 'งูคอร์น อะเนอริธริสติก สีเทาดำ สง่างาม',
                price: 2800,
                stock: 4,
                color: 'เทา-ดำ',
                age: '8 เดือน',
                gender: 'female',
                categoryId: categories[1].id,
                image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Corn Snake - Snow',
                description: 'งูคอร์น สโนว์ สีขาวอมชมพู หายากสวยมาก',
                price: 4500,
                stock: 3,
                color: 'ขาว-ชมพู',
                age: '6 เดือน',
                gender: 'male',
                categoryId: categories[1].id,
                image: 'https://images.unsplash.com/photo-1570741066052-817c6de995c8?w=400',
            },
        }),
        // Pythons
        prisma.snake.create({
            data: {
                name: 'Reticulated Python - Normal',
                description: 'งูเหลือมลายสวย ขนาดใหญ่ สีน้ำตาลทอง',
                price: 5000,
                stock: 2,
                color: 'น้ำตาล-ทอง',
                age: '1.5 ปี',
                gender: 'male',
                categoryId: categories[0].id,
                image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Reticulated Python - Super Dwarf',
                description: 'งูเหลือมขนาดเล็กพิเศษ เลี้ยงง่ายกว่าปกติ',
                price: 15000,
                stock: 1,
                color: 'เหลือง-ดำ',
                age: '2 ปี',
                gender: 'female',
                categoryId: categories[0].id,
                image: 'https://images.unsplash.com/photo-1531386151447-fd76ad50012f?w=400',
            },
        }),
        // Hognose
        prisma.snake.create({
            data: {
                name: 'Western Hognose - Normal',
                description: 'งูหางกระดิ่งตะวันตก นิสัยน่ารัก ปากเชิดขึ้น',
                price: 6500,
                stock: 3,
                color: 'น้ำตาล-เหลือง',
                age: '10 เดือน',
                gender: 'female',
                categoryId: categories[3].id,
                image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
            },
        }),
        prisma.snake.create({
            data: {
                name: 'Western Hognose - Albino',
                description: 'งูหางกระดิ่งอัลบิโน สีสันสดใส หายากมาก',
                price: 12000,
                stock: 1,
                color: 'ส้ม-ขาว',
                age: '1 ปี',
                gender: 'male',
                categoryId: categories[3].id,
                image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=400',
            },
        }),
    ]);

    console.log(`✅ Created ${snakes.length} snakes`);

    // Create sample orders
    const order1 = await prisma.order.create({
        data: {
            total: 6000,
            status: 'completed',
            paymentMethod: 'cash',
            items: {
                create: [
                    { snakeId: snakes[0].id, quantity: 1, price: 3500 },
                    { snakeId: snakes[3].id, quantity: 1, price: 2500 },
                ],
            },
        },
    });

    const order2 = await prisma.order.create({
        data: {
            total: 8500,
            status: 'completed',
            paymentMethod: 'transfer',
            items: {
                create: [
                    { snakeId: snakes[1].id, quantity: 1, price: 8500 },
                ],
            },
        },
    });

    console.log(`✅ Created 2 sample orders`);

    console.log('🎉 Seeding completed!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
