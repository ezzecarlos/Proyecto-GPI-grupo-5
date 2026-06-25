"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const movement_controller_1 = require("../controllers/movement.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.verifyToken);
router.get('/', movement_controller_1.getMovements); // Todos los roles autenticados pueden ver movimientos
router.post('/', (0, rbac_middleware_1.checkRole)(['ADMINISTRADOR', 'BODEGUERO']), movement_controller_1.createMovement); // Vendedor no puede registrar movimientos
exports.default = router;
