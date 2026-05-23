import { Router } from 'express';
import * as eventsController from '../controllers/eventsController';

const router = Router();

router.get('/', eventsController.getAllEventTypes);
router.get('/:slug', eventsController.getEventTypeBySlug);
router.post('/', eventsController.createEventType);
router.put('/:id', eventsController.updateEventType);
router.delete('/:id', eventsController.deleteEventType);

export default router;
