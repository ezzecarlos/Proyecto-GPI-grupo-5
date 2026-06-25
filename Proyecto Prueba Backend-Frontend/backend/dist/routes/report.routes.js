"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const report_controller_1 = require("../controllers/report.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protege el endpoint de reportes con autenticación JWT
router.use(auth_middleware_1.verifyToken);
router.get('/inventory', report_controller_1.getInventoryReport);
exports.default = router;
