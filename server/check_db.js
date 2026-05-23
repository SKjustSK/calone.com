const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({ where: { slug: 'admin' }});
  if (!user) return console.log('No user');
  const avail = await prisma.availability.findMany({ where: { userId: user.id }});
  console.log('Availability:', avail);
  const events = await prisma.eventType.findMany({ where: { userId: user.id }});
  console.log('Events:', events);
}
main().finally(() => prisma.$disconnect());
