import { Request, Response } from 'express';
import * as bookingsService from '../services/bookingsService';

/**
 * Retrieves all bookings for the logged-in user's event types.
 * @param req Express request object
 * @param res Express response object
 */
export const getBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const bookings = await bookingsService.getBookingsByUser(req.user!.id);
    res.json(bookings);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Creates a new booking.
 * Contains logic to prevent double-booking the same time slot.
 * @param req Express request object containing booking details
 * @param res Express response object
 */
export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const booking = await bookingsService.createBooking(req.body);
    res.status(201).json(booking);
  } catch (error: any) {
    console.error('Booking error:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Cancels a booking by updating its status to 'CANCELLED'.
 * @param req Express request object
 * @param res Express response object
 */
export const cancelBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    await bookingsService.cancelBooking(req.params.id as string);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
