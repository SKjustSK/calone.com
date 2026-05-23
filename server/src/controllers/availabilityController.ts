import { Request, Response } from 'express';
import * as availabilityService from '../services/availabilityService';

/**
 * Retrieves the availability schedule for a user.
 * If querying for the public booking page, it uses the userId from the query.
 * Otherwise, it defaults to the logged-in user.
 * @param req Express request object
 * @param res Express response object
 */
export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || req.user!.id;
    const availability = await availabilityService.getAvailability(userId);
    res.json(availability);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Updates the availability schedule for the logged-in user.
 * This completely replaces the existing schedule.
 * @param req Express request object containing the new schedule array
 * @param res Express response object
 */
export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const availability = await availabilityService.updateAvailability(req.user!.id, req.body.schedule);
    res.json(availability);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
