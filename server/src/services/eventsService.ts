import prisma from '../utils/prisma';
import { EventType } from '@prisma/client';

/**
 * Fetches all event types belonging to a specific user.
 * @param userId The ID of the user
 * @returns A promise resolving to an array of EventTypes
 */
export const getEventsByUser = async (userId: string): Promise<EventType[]> => {
  return prisma.eventType.findMany({ where: { userId } });
};

/**
 * Fetches an event type by its unique URL slug, including the owner's user details.
 * @param slug The unique URL slug of the event
 * @returns A promise resolving to the EventType with User relation, or null
 */
export const getEventBySlug = async (slug: string) => {
  return prisma.eventType.findFirst({
    where: { slug },
    include: { user: true }
  });
};

/**
 * Creates a new event type in the database.
 * @param data The payload containing title, description, duration, slug, and userId
 * @returns A promise resolving to the created EventType
 */
export const createEvent = async (data: Omit<EventType, 'id'>): Promise<EventType> => {
  return prisma.eventType.create({ data });
};

/**
 * Updates an existing event type.
 * @param id The ID of the event to update
 * @param data The partial payload of fields to update
 * @returns A promise resolving to the updated EventType
 */
export const updateEvent = async (id: string, data: Partial<EventType>): Promise<EventType> => {
  return prisma.eventType.update({ where: { id }, data });
};

/**
 * Deletes an event type from the database.
 * @param id The ID of the event to delete
 * @returns A promise resolving to the deleted EventType
 */
export const deleteEvent = async (id: string): Promise<EventType> => {
  return prisma.eventType.delete({ where: { id } });
};
