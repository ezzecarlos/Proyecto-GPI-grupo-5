import { Router } from 'express';
import { getAllMovements, createMovement } from '../controllers/movement.controller';
import { authenticateToken } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticateToken as any);

router.get('/', getAllMovements as any);
router.post('/', createMovement as any);

export default router;
