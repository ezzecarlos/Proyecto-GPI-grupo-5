"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMovement = exports.getMovements = void 0;
const db_1 = require("../config/db");
const getMovements = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        let queryText = `
      SELECT m.id, m."productId", m.type, m.qty, m.before, m.after, m."userName", m.note, m.created_at,
             p.name as "productName", p.code as "productCode"
      FROM movements m
      JOIN products p ON m."productId" = p.id
    `;
        const queryParams = [];
        const conditions = [];
        if (startDate) {
            queryParams.push(startDate);
            conditions.push(`m.created_at >= $${queryParams.length}`);
        }
        if (endDate) {
            queryParams.push(`${endDate} 23:59:59`);
            conditions.push(`m.created_at <= $${queryParams.length}`);
        }
        if (conditions.length > 0) {
            queryText += ' WHERE ' + conditions.join(' AND ');
        }
        queryText += ' ORDER BY m.created_at DESC';
        const result = await db_1.pool.query(queryText, queryParams);
        res.json(result.rows);
    }
    catch (error) {
        console.error('Error al obtener movimientos:', error);
        res.status(500).json({ message: 'Error al obtener movimientos' });
    }
};
exports.getMovements = getMovements;
const createMovement = async (req, res) => {
    const { productId, type, qty, note } = req.body;
    const userName = req.user?.name || 'Sistema';
    // Validaciones básicas
    const numericQty = Number(qty);
    if (isNaN(numericQty) || numericQty <= 0) {
        return res.status(400).json({ message: 'La cantidad debe ser un número entero mayor a cero' });
    }
    if (!['Entrada', 'Salida', 'Ajuste'].includes(type)) {
        return res.status(400).json({ message: 'Tipo de movimiento inválido. Debe ser Entrada, Salida o Ajuste' });
    }
    const client = await db_1.pool.connect();
    try {
        await client.query('BEGIN');
        // Bloqueamos la fila del producto para actualizar de forma segura
        const prodResult = await client.query('SELECT stock, name FROM products WHERE id = $1 FOR UPDATE', [productId]);
        if (prodResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        const currentStock = prodResult.rows[0].stock;
        let newStock = currentStock;
        if (type === 'Entrada') {
            newStock += numericQty;
        }
        else if (type === 'Salida') {
            if (currentStock < numericQty) {
                await client.query('ROLLBACK');
                return res.status(400).json({ message: `Stock insuficiente para ${prodResult.rows[0].name}. Stock actual: ${currentStock}` });
            }
            newStock -= numericQty;
        }
        else if (type === 'Ajuste') {
            newStock = numericQty;
        }
        // Insertar el movimiento en la base de datos
        await client.query(`INSERT INTO movements ("productId", type, qty, before, after, "userName", note) 
       VALUES ($1, $2, $3, $4, $5, $6, $7)`, [productId, type, numericQty, currentStock, newStock, userName, note || '']);
        // Actualizar el stock del producto
        await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);
        await client.query('COMMIT');
        res.status(201).json({ message: 'Movimiento registrado con éxito' });
    }
    catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar movimiento:', error);
        res.status(500).json({ message: 'Error al registrar el movimiento' });
    }
    finally {
        client.release();
    }
};
exports.createMovement = createMovement;
