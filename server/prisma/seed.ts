import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Reset existing data (if any remains)
  await prisma.booking.deleteMany({});
  await prisma.availability.deleteMany({});
  await prisma.eventType.deleteMany({});
  await prisma.user.deleteMany({});

  // 1. Create Admin User
  const adminId = '70a7e799-76a4-4528-8f0f-4448e5c4caf6';
  const admin = await prisma.user.create({
    data: {
      id: adminId,
      name: 'Admin User',
      email: 'admin@calclone.com',
      slug: 'admin',
      timezone: 'Asia/Calcutta'
    }
  });

  console.log('Created admin user:', admin.email);

  // 2. Create Event Types
  const event15 = await prisma.eventType.create({
    data: {
      title: '15 Min Meeting',
      description: 'A quick 15-minute catchup.',
      duration: 15,
      slug: '15min',
      userId: admin.id
    }
  });

  const event30 = await prisma.eventType.create({
    data: {
      title: '30 Min Discovery Call',
      description: 'Discuss potential collaborations.',
      duration: 30,
      slug: '30min',
      userId: admin.id
    }
  });

  const event60 = await prisma.eventType.create({
    data: {
      title: '60 Min Deep Dive',
      description: 'Detailed technical discussion.',
      duration: 60,
      slug: '60min',
      userId: admin.id
    }
  });

  console.log('Created event types.');

  // 3. Create Availability
  const days = [1, 2, 3, 4, 5]; // Mon to Fri
  const availabilityData = days.map(day => ({
    dayOfWeek: day,
    startTime: '09:00',
    endTime: '17:00',
    userId: admin.id
  }));

  await prisma.availability.createMany({
    data: availabilityData
  });

  console.log('Created availability schedule.');

  // 4. Create Bookings
  const now = new Date();
  const getNextWorkingDay = (startDate: Date, skipDays: number): Date => {
    let d = new Date(startDate);
    let added = 0;
    while (added < skipDays) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) added++;
    }
    return d;
  };

  const getPrevWorkingDay = (startDate: Date, skipDays: number): Date => {
    let d = new Date(startDate);
    let subtracted = 0;
    while (subtracted < skipDays) {
      d.setDate(d.getDate() - 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) subtracted++;
    }
    return d;
  };

  const getCleanDate = (date: Date, hours: number, minutes: number = 0) => {
    const d = new Date(date);
    d.setHours(hours, minutes, 0, 0);
    return d;
  };

  const pastDate1 = getCleanDate(getPrevWorkingDay(now, 1), 10, 0); // 10:00 AM
  const pastDate2 = getCleanDate(getPrevWorkingDay(now, 3), 14, 30); // 2:30 PM
  const upcomingDate1 = getCleanDate(getNextWorkingDay(now, 1), 9, 15); // 9:15 AM
  const upcomingDate2 = getCleanDate(getNextWorkingDay(now, 2), 15, 0); // 3:00 PM
  const cancelledDate = getCleanDate(getNextWorkingDay(now, 3), 11, 30); // 11:30 AM

  // Past Bookings
  const pastBookings = [
    {
      eventTypeId: event15.id,
      bookerName: 'John Doe',
      bookerEmail: 'john@example.com',
      startTime: pastDate1,
      endTime: new Date(pastDate1.getTime() + 15 * 60000),
      status: 'ACCEPTED'
    },
    {
      eventTypeId: event30.id,
      bookerName: 'Jane Smith',
      bookerEmail: 'jane@example.com',
      startTime: pastDate2,
      endTime: new Date(pastDate2.getTime() + 30 * 60000),
      status: 'ACCEPTED'
    }
  ];

  // Upcoming Bookings
  const upcomingBookings = [
    {
      eventTypeId: event15.id,
      bookerName: 'Alice Johnson',
      bookerEmail: 'alice@example.com',
      startTime: upcomingDate1,
      endTime: new Date(upcomingDate1.getTime() + 15 * 60000),
      status: 'ACCEPTED'
    },
    {
      eventTypeId: event60.id,
      bookerName: 'Bob Williams',
      bookerEmail: 'bob@example.com',
      startTime: upcomingDate2,
      endTime: new Date(upcomingDate2.getTime() + 60 * 60000),
      status: 'ACCEPTED'
    },
    {
      eventTypeId: event30.id,
      bookerName: 'Charlie Brown',
      bookerEmail: 'charlie@example.com',
      startTime: cancelledDate,
      endTime: new Date(cancelledDate.getTime() + 30 * 60000),
      status: 'CANCELLED'
    }
  ];

  await prisma.booking.createMany({
    data: [...pastBookings, ...upcomingBookings]
  });

  console.log('Created dummy bookings.');
  console.log('Database successfully seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
