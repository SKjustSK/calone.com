const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'admin@calclone.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@calclone.com',
      slug: 'admin',
    },
  })
  
  console.log('Seeded User:', user)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
