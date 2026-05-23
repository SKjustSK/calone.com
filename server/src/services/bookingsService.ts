import prisma from '../utils/prisma';
import { Booking } from '@prisma/client';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

/**
 * Fetches all bookings associated with the event types owned by the user.
 * @param userId The ID of the owner user
 * @returns A promise resolving to an array of Bookings with EventType relations
 */
export const getBookingsByUser = async (userId: string) => {
  return prisma.booking.findMany({
    where: { eventType: { userId } },
    include: { eventType: true },
    orderBy: { startTime: 'asc' }
  });
};

/**
 * Creates a new booking and prevents double-booking for the same event type.
 * @param data The booking payload (eventTypeId, bookerName, bookerEmail, startTime, endTime)
 * @returns A promise resolving to the created Booking
 * @throws Error if the time slot is already booked
 */
export const createBooking = async (data: Omit<Booking, 'id' | 'status'>): Promise<Booking> => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  // 1. Prevent booking in the past
  if (start < new Date()) {
    throw new Error('Cannot book in the past.');
  }

  // 2. Fetch event type to get the host userId, and their availability
  const eventType = await prisma.eventType.findUnique({
    where: { id: data.eventTypeId },
    include: { user: { include: { availability: true } } }
  });

  if (!eventType) {
    throw new Error('Event type not found.');
  }

  const host = eventType.user;

  // 3. Availability Validation
  const hostTimezone = host.timezone || 'Asia/Calcutta';
  
  const zonedStart = toZonedTime(start, hostTimezone);
  const zonedEnd = toZonedTime(end, hostTimezone);

  const dayOfWeek = zonedStart.getDay(); // 0 = Sunday
  
  const dayAvailability = host.availability.find(a => a.dayOfWeek === dayOfWeek);
  
  if (!dayAvailability) {
    throw new Error('Host is not available on this day.');
  }

  const requestedStartStr = format(zonedStart, 'HH:mm');
  const requestedEndStr = format(zonedEnd, 'HH:mm');
  
  if (zonedStart.getDate() !== zonedEnd.getDate()) {
      throw new Error('Booking spans multiple days.');
  }

  if (requestedStartStr < dayAvailability.startTime || requestedEndStr > dayAvailability.endTime) {
    throw new Error('Requested time is outside host availability.');
  }
  
  const diffMinutes = (end.getTime() - start.getTime()) / 60000;
  if (diffMinutes !== eventType.duration) {
      throw new Error('Booking duration does not match event type duration.');
  }

  // 4. Concurrency & Double Booking Check across all host's events
  return prisma.$transaction(async (tx) => {
    const existingBooking = await tx.booking.findFirst({
      where: {
        eventType: { userId: host.id },
        status: 'ACCEPTED',
        startTime: { lt: end },
        endTime: { gt: start },
      }
    });

    if (existingBooking) {
      throw new Error('This time slot is already booked.');
    }

    return tx.booking.create({
      data: {
        eventTypeId: data.eventTypeId,
        bookerName: data.bookerName,
        bookerEmail: data.bookerEmail,
        startTime: start,
        endTime: end,
      }
    });
  }, {
    isolationLevel: 'Serializable'
  });
};

/**
 * Cancels a booking by its ID.
 * @param id The ID of the booking to cancel
 * @returns A promise resolving to the updated Booking
 */
export const cancelBooking = async (id: string): Promise<Booking> => {
  return prisma.booking.update({
    where: { id },
    data: { status: 'CANCELLED' }
  });
};
