import { Router } from 'express';
import { createMovement, getMovements } from '../controllers/movement.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/rbac.middleware';

const router = Router();

router.use(verifyToken);

router.get('/', getMovements); // Todos los roles autenticados pueden ver movimientos
router.post('/', checkRole(['ADMINISTRADOR', 'BODEGUERO']), createMovement); // Vendedor no puede registrar movimientos

export default router;