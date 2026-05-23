import prisma from '../utils/prisma';
import { Booking, BookingStatus } from '@prisma/client';
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
    include: { user: { include: { availability: true, dateOverrides: true } } }
  });

  if (!eventType) {
    throw new Error('Event type not found.');
  }

  const host = eventType.user;

  // 3. Availability Validation
  const hostTimezone = host.timezone || 'Asia/Calcutta';
  
  const zonedStart = toZonedTime(start, hostTimezone);
  const zonedEnd = toZonedTime(end, hostTimezone);

  if (zonedStart.getDate() !== zonedEnd.getDate()) {
      throw new Error('Booking spans multiple days.');
  }

  const requestedDateStr = format(zonedStart, 'yyyy-MM-dd');
  const requestedStartStr = format(zonedStart, 'HH:mm');
  const requestedEndStr = format(zonedEnd, 'HH:mm');
  
  const override = host.dateOverrides.find(o => format(toZonedTime(o.date, hostTimezone), 'yyyy-MM-dd') === requestedDateStr);
  
  let validShifts: { startTime: string, endTime: string }[] = [];

  if (override) {
    if (override.isDayOff) {
      throw new Error('Host is not available on this date.');
    }
    validShifts = [{ startTime: override.startTime, endTime: override.endTime }];
  } else {
    const dayOfWeek = zonedStart.getDay(); // 0 = Sunday
    validShifts = host.availability.filter(a => a.dayOfWeek === dayOfWeek);
  }

  if (validShifts.length === 0) {
    throw new Error('Host is not available on this day.');
  }

  const isValidTime = validShifts.some(shift => {
    return requestedStartStr >= shift.startTime && requestedEndStr <= shift.endTime;
  });

  if (!isValidTime) {
    throw new Error('Requested time is outside host availability.');
  }
  
  const diffMinutes = (end.getTime() - start.getTime()) / 60000;
  if (diffMinutes !== eventType.duration) {
      throw new Error('Booking duration does not match event type duration.');
  }

  // 4. Concurrency & Double Booking Check across all host's events
  return prisma.$transaction(async (tx) => {
    // Fetch all future accepted bookings to check against their buffer times
    const existingBookings = await tx.booking.findMany({
      where: {
        eventType: { userId: host.id },
        status: BookingStatus.ACCEPTED,
        endTime: { gt: new Date() } // Only care about bookings that haven't ended
      },
      include: { eventType: { select: { bufferTime: true } } }
    });

    const hasConflict = existingBookings.some(b => {
      // Buffer times apply BEFORE and AFTER the actual meeting
      const existingBuffer = b.eventType?.bufferTime || 0;
      const bStartWithBuffer = new Date(b.startTime.getTime() - existingBuffer * 60000);
      const bEndWithBuffer = new Date(b.endTime.getTime() + existingBuffer * 60000);
      
      const reqStartWithBuffer = new Date(start.getTime() - eventType.bufferTime * 60000);
      const reqEndWithBuffer = new Date(end.getTime() + eventType.bufferTime * 60000);

      return reqStartWithBuffer < bEndWithBuffer && reqEndWithBuffer > bStartWithBuffer;
    });

    if (hasConflict) {
      throw new Error('This time slot is already booked or overlaps with a buffer time.');
    }

    return tx.booking.create({
      data: {
        eventTypeId: data.eventTypeId,
        bookerName: data.bookerName,
        bookerEmail: data.bookerEmail,
        startTime: start,
        endTime: end,
        status: BookingStatus.ACCEPTED,
        customResponses: data.customResponses || {},
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
    data: { status: BookingStatus.CANCELLED }
  });
};
