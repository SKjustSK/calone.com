const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { slug: 'admin' }});
  if (!user) return console.log('No user');
  
  const days = [1, 2, 3, 4, 5]; // Mon-Fri
  for (const day of days) {
    await prisma.availability.create({
      data: {
        userId: user.id,
        dayOfWeek: day,
        startTime: '09:00',
        endTime: '17:00'
      }
    });
  }
  console.log('Seeded default availability');
}
main().finally(() => prisma.$disconnect());
