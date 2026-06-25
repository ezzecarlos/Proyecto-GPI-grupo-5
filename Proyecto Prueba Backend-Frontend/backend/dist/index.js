"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const movement_routes_1 = __importDefault(require("./routes/movement.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const report_routes_1 = __importDefault(require("./routes/report.routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5001; // Puerto adaptado a 5001
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Rutas
app.use('/api/auth', auth_routes_1.default);
app.use('/api/products', product_routes_1.default);
app.use('/api/movements', movement_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/reports', report_routes_1.default);
// Iniciar servidor
app.listen(Number(PORT), '127.0.0.1', () => {
    console.log(`Servidor Backend corriendo en http://127.0.0.1:${PORT}`);
});
