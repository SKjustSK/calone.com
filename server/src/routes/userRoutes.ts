import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.get('/me', userController.getMe);
router.put('/me', userController.updateMe);

export default router;
