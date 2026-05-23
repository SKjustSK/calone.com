import { Request, Response } from 'express';
import * as eventsService from '../services/eventsService';

/**
 * Retrieves all event types for the currently logged-in user.
 * @param req Express request object containing the user context
 * @param res Express response object
 */
export const getAllEventTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await eventsService.getEventsByUser(req.user!.id);
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves a single event type by ID (for the editor page).
 */
export const getEventTypeById = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventsService.getEventById(req.params.id as string);
    if (!event) {
      res.status(404).json({ error: 'Event type not found' });
      return;
    }
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves all event types for a public user profile.
 * @param req Express request object
 * @param res Express response object
 */
export const getUserEventsPublic = async (req: Request, res: Response): Promise<void> => {
  try {
    const events = await eventsService.getPublicEventsByUsername(req.params.username as string);
    if (!events) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(events);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Retrieves a specific event type by its URL slug.
 * Useful for the public booking page to fetch event details.
 * @param req Express request object
 * @param res Express response object
 */
export const getEventTypeBySlug = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventsService.getEventBySlugAndUser(req.params.username as string, req.params.slug as string);
    if (!event) {
      res.status(404).json({ error: 'Event Type not found' });
      return;
    }
    res.json(event);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Creates a new event type.
 * @param req Express request object containing event details in the body
 * @param res Express response object
 */
export const createEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const data = { ...req.body, userId: req.user!.id };
    const event = await eventsService.createEvent(data);
    res.status(201).json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Updates an existing event type.
 * @param req Express request object
 * @param res Express response object
 */
export const updateEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    const event = await eventsService.updateEvent(req.params.id as string, req.body);
    res.json(event);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Deletes an event type by ID.
 * @param req Express request object
 * @param res Express response object
 */
export const deleteEventType = async (req: Request, res: Response): Promise<void> => {
  try {
    await eventsService.deleteEvent(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
