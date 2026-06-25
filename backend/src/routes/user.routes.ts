import { Router } from 'express';
import { getUsers, createUser, updateUser, deleteUser } from '../controllers/user.controller';
import { verifyToken } from '../middlewares/auth.middleware';
import { checkRole } from '../middlewares/rbac.middleware';

const router = Router();

// Todas las rutas de gestión de usuarios requieren autenticación y rol ADMINISTRADOR
router.use(verifyToken);
router.use(checkRole(['ADMINISTRADOR']));

router.get('/', getUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
