"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = exports.getUsers = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = require("../config/db");
const getUsers = async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT id, name, email, role FROM users ORDER BY id ASC');
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};
exports.getUsers = getUsers;
const createUser = async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password || !role) {
        return res.status(400).json({ message: 'Todos los campos son obligatorios (nombre, email, password, rol)' });
    }
    // Validar rol
    if (!['ADMINISTRADOR', 'BODEGUERO', 'VENDEDOR'].includes(role)) {
        return res.status(400).json({ message: 'Rol inválido. Debe ser ADMINISTRADOR, BODEGUERO o VENDEDOR' });
    }
    try {
        // Verificar si el correo ya existe
        const existsResult = await db_1.pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existsResult.rows.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        const result = await db_1.pool.query(`INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) RETURNING id, name, email, role`, [name, email, passwordHash, role]);
        res.status(201).json(result.rows[0]);
    }
    catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ message: 'Error al crear usuario' });
    }
};
exports.createUser = createUser;
