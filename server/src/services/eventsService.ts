import prisma from '../utils/prisma';
import { EventType, Prisma, BookingStatus } from '@prisma/client';

/**
 * Fetches all event types belonging to a specific user.
 * @param userId The ID of the user
 * @returns A promise resolving to an array of EventTypes
 */
export const getEventsByUser = async (userId: string) => {
  return prisma.eventType.findMany({ where: { userId, isArchived: false }, include: { user: true } });
};

/**
 * Fetches all event types for a public profile by username.
 * @param username The slug of the user
 */
export const getPublicEventsByUsername = async (username: string) => {
  return prisma.eventType.findMany({
    where: { user: { slug: username }, isArchived: false, isActive: true },
    include: { user: { select: { name: true, slug: true, email: true } } }
  });
};

/**
 * Fetches a single event type by ID for the editor page.
 */
export const getEventById = async (id: string): Promise<EventType | null> => {
  return prisma.eventType.findFirst({ where: { id, isArchived: false } });
};

/**
 * Fetches an event type by its unique URL slug, including the owner's user details.
 * @param slug The unique URL slug of the event
 * @returns A promise resolving to the EventType with User relation, or null
 */
export const getEventBySlugAndUser = async (username: string, slug: string) => {
  const event = await prisma.eventType.findFirst({
    where: { slug, isArchived: false, user: { slug: username } },
    include: { user: true }
  });

  if (!event) return null;

  // Fetch all accepted bookings for this user across all their event types
  // This allows the frontend to prevent double booking across different event types
  const allUserBookings = await prisma.booking.findMany({
    where: {
      eventType: { userId: event.userId },
      status: BookingStatus.ACCEPTED,
      endTime: { gt: new Date() } // Only future bookings needed for slot blocking
    },
    select: { startTime: true, endTime: true, status: true, eventType: { select: { bufferTime: true } } }
  });

  return {
    ...event,
    bookings: allUserBookings
  };
};

/**
 * Creates a new event type in the database.
 * @param data The payload containing title, description, duration, slug, and userId
 * @returns A promise resolving to the created EventType
 */
export const createEvent = async (data: Prisma.EventTypeUncheckedCreateInput): Promise<EventType> => {
  return prisma.eventType.create({ data });
};

/**
 * Updates an existing event type.
 * @param id The ID of the event to update
 * @param data The partial payload of fields to update
 * @returns A promise resolving to the updated EventType
 */
export const updateEvent = async (id: string, data: Prisma.EventTypeUncheckedUpdateInput): Promise<EventType> => {
  return prisma.eventType.update({ where: { id }, data });
};

/**
 * Deletes an event type from the database.
 * @param id The ID of the event to delete
 * @returns A promise resolving to the deleted EventType
 */
export const deleteEvent = async (id: string): Promise<EventType> => {
  return prisma.eventType.update({ 
    where: { id },
    data: { 
      isArchived: true,
      slug: `${id}-archived` // Free up the original slug for future use
    }
  });
};
