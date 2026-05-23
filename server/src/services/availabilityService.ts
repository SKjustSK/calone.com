import prisma from '../utils/prisma';
import { Availability } from '@prisma/client';

/**
 * Fetches the availability schedule for a specific user.
 * @param userId The ID of the user
 * @returns A promise resolving to an array of Availability rules
 */
export const getAvailability = async (userId: string) => {
  const availability = await prisma.availability.findMany({ where: { userId } });
  const dateOverrides = await prisma.dateOverride.findMany({ where: { userId } });
  return { availability, dateOverrides };
};

/**
 * Replaces the entire availability schedule for a user within a transaction.
 * @param userId The ID of the user
 * @param schedule An array of availability payload objects (dayOfWeek, startTime, endTime)
 * @returns A promise resolving to the newly created Availability array
 */
export const updateAvailability = async (
  userId: string, 
  schedule: Omit<Availability, 'id' | 'userId'>[]
): Promise<Availability[]> => {
  return prisma.$transaction(async (tx) => {
    // Delete old
    await tx.availability.deleteMany({ where: { userId } });
    
    // Create new
    const data = schedule.map(s => ({ ...s, userId }));
    if (data.length > 0) {
      await tx.availability.createMany({ data });
    }
    return tx.availability.findMany({ where: { userId } });
  });
};
