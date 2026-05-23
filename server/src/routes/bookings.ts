import { Router } from 'express';
import * as bookingsController from '../controllers/bookingsController';

const router = Router();

router.get('/', bookingsController.getBookings);
router.post('/', bookingsController.createBooking);
router.delete('/:id', bookingsController.cancelBooking);

export default router;
