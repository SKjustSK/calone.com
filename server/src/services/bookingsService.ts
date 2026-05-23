import prisma from '../utils/prisma';
import { Booking } from '@prisma/client';

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
  // Prevent double booking logic by checking overlapping accepted times
  const existingBooking = await prisma.booking.findFirst({
    where: {
      eventTypeId: data.eventTypeId,
      status: 'ACCEPTED',
      startTime: { lt: new Date(data.endTime) },
      endTime: { gt: new Date(data.startTime) },
    }
  });

  if (existingBooking) {
    throw new Error('This time slot is already booked.');
  }

  return prisma.booking.create({ 
    data: {
      eventTypeId: data.eventTypeId,
      bookerName: data.bookerName,
      bookerEmail: data.bookerEmail,
      startTime: new Date(data.startTime),
      endTime: new Date(data.endTime),
    } 
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
