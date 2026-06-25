"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const router = (0, express_1.Router)();
// Todas las rutas de gestión de usuarios requieren autenticación y rol ADMINISTRADOR
router.use(auth_middleware_1.verifyToken);
router.use((0, rbac_middleware_1.checkRole)(['ADMINISTRADOR']));
router.get('/', user_controller_1.getUsers);
router.post('/', user_controller_1.createUser);
exports.default = router;
