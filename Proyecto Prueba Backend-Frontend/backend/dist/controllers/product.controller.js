"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPredictiveAlerts = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const db_1 = require("../config/db");
const getProducts = async (req, res) => {
    try {
        const result = await db_1.pool.query('SELECT * FROM products ORDER BY id ASC');
        // Mapeamos el estado basado en el stock y minStock
        const products = result.rows.map(p => {
            let status = "Disponible";
            if (p.stock === 0)
                status = "Sin stock";
            else if (p.stock < p.minStock)
                status = "Stock bajo";
            return { ...p, status };
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al obtener productos' });
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res) => {
    const { code, name, brand, category, stock, minStock } = req.body;
    try {
        const result = await db_1.pool.query(`INSERT INTO products (code, name, brand, category, stock, "minStock") 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`, [code, name, brand, category, stock || 0, minStock || 0]);
        res.status(201).json({ ...result.rows[0], status: "Disponible" });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al crear producto' });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, brand, category, minStock } = req.body;
    try {
        const result = await db_1.pool.query(`UPDATE products SET name = $1, brand = $2, category = $3, "minStock" = $4 WHERE id = $5 RETURNING *`, [name, brand, category, minStock, id]);
        res.json(result.rows[0]);
    }
    catch (error) {
        res.status(500).json({ message: 'Error al actualizar producto' });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        // Soft delete (desactivar)
        await db_1.pool.query('UPDATE products SET active = false WHERE id = $1', [id]);
        res.json({ message: 'Producto desactivado' });
    }
    catch (error) {
        res.status(500).json({ message: 'Error al eliminar producto' });
    }
};
exports.deleteProduct = deleteProduct;
const getPredictiveAlerts = async (req, res) => {
    try {
        // 1. Obtener la suma de salidas en los últimos 30 días agrupado por producto
        const movementsResult = await db_1.pool.query(`SELECT "productId", SUM(qty) as "totalSold" 
       FROM movements 
       WHERE type = 'Salida' AND created_at >= NOW() - INTERVAL '30 days'
       GROUP BY "productId"`);
        const salesMap = {};
        movementsResult.rows.forEach(row => {
            salesMap[row.productId] = Number(row.totalSold);
        });
        // 2. Obtener los productos activos
        const productsResult = await db_1.pool.query(`SELECT * FROM products WHERE active = true ORDER BY id ASC`);
        const alerts = productsResult.rows.map(p => {
            const totalSold = salesMap[p.id] || 0;
            const dailyVelocity = totalSold / 30.0;
            let daysLeft = 999; // Valor por defecto si no hay salidas (indefinido)
            if (p.stock === 0) {
                daysLeft = 0;
            }
            else if (dailyVelocity > 0) {
                daysLeft = p.stock / dailyVelocity;
            }
            return {
                id: p.id,
                code: p.code,
                name: p.name,
                brand: p.brand,
                category: p.category,
                stock: p.stock,
                minStock: p.minStock,
                dailyVelocity: Number(dailyVelocity.toFixed(2)),
                daysLeft: Number(daysLeft.toFixed(1))
            };
        });
        // Filtrar los productos en riesgo: stock dura menos de 7 días (1 semana) o stock es 0
        const filteredAlerts = alerts.filter(a => a.daysLeft <= 7 || a.stock === 0);
        res.json(filteredAlerts);
    }
    catch (error) {
        console.error('Error al obtener alertas predictivas:', error);
        res.status(500).json({ message: 'Error al calcular alertas predictivas' });
    }
};
exports.getPredictiveAlerts = getPredictiveAlerts;
