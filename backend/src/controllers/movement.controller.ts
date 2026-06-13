import { Response } from 'express';
import { inventoryDbPool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Obtener todos los movimientos de inventario
export async function getAllMovements(req: AuthenticatedRequest, res: Response) {
  try {
    const [rows]: any = await inventoryDbPool.query(`
      SELECT 
        m.id_movimiento as id,
        m.producto_id,
        p.nombre as producto_nombre,
        m.sku,
        m.tipo_movimiento as tipo,
        m.motivo,
        m.cantidad,
        m.stock_resultante_bodega as stock_resultante,
        m.ubicacion_bodega,
        m.ejecutado_por_id_usuario,
        m.ejecutado_por_nombre,
        m.fecha_movimiento as fecha
      FROM inventario_movimientos m
      JOIN productos p ON m.producto_id = p.id_producto
      ORDER BY m.fecha_movimiento DESC
    `);

    return res.json(rows);
  } catch (error: any) {
    console.error('Error al obtener movimientos:', error);
    return res.status(500).json({ message: 'Error al obtener los movimientos de inventario.', error: error.message });
  }
}

// Crear un nuevo movimiento de inventario (Entrada / Salida / Ajuste)
export async function createMovement(req: AuthenticatedRequest, res: Response) {
  const {
    productId,
    tipo, // 'Entrada' | 'Salida' | 'Ajuste'
    motivo,
    cantidad,
    ubicacionBodega = 'Bodega Central'
  } = req.body;

  if (!productId || !tipo || cantidad === undefined || !motivo) {
    return res.status(400).json({ message: 'productId, tipo (Entrada/Salida/Ajuste), cantidad y motivo son requeridos.' });
  }

  const qty = parseInt(cantidad);
  if (isNaN(qty) || qty <= 0) {
    return res.status(400).json({ message: 'La cantidad debe ser un número entero mayor a cero.' });
  }

  const connection = await inventoryDbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Obtener información del producto
    const [prodRows]: any = await connection.query(
      'SELECT sku, nombre, stock_actual, stock_minimo FROM productos WHERE id_producto = ? AND activo = 1 FOR UPDATE',
      [productId]
    );

    if (prodRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'Producto no encontrado o inactivo.' });
    }

    const product = prodRows[0];
    let nuevoStock = product.stock_actual;

    // 2. Calcular nuevo stock según tipo de movimiento
    if (tipo === 'Entrada') {
      nuevoStock += qty;
    } else if (tipo === 'Salida' || tipo === 'Ajuste') {
      if (product.stock_actual < qty) {
        await connection.rollback();
        return res.status(400).json({ 
          message: `Stock insuficiente para realizar la salida. Stock actual: ${product.stock_actual}, solicitado: ${qty}` 
        });
      }
      nuevoStock -= qty;
    } else {
      await connection.rollback();
      return res.status(400).json({ message: 'Tipo de movimiento inválido. Debe ser Entrada, Salida o Ajuste.' });
    }

    // 3. Actualizar stock actual del producto
    await connection.query(
      'UPDATE productos SET stock_actual = ? WHERE id_producto = ?',
      [nuevoStock, productId]
    );

    // 4. Insertar el movimiento en inventario_movimientos
    // Usamos la información del usuario autenticado proveniente del token JWT (de la DB de autenticación)
    const ejecutadoPorId = req.user?.id || 1;
    const ejecutadoPorNombre = req.user?.nombre_completo || 'Sistema';

    const [movResult]: any = await connection.query(
      `INSERT INTO inventario_movimientos 
        (producto_id, sku, tipo_movimiento, motivo, cantidad, stock_resultante_bodega, ubicacion_bodega, ejecutado_por_id_usuario, ejecutado_por_nombre) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      , [
        productId,
        product.sku,
        tipo,
        motivo,
        qty,
        nuevoStock,
        ubicacionBodega,
        ejecutadoPorId,
        ejecutadoPorNombre
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Movimiento registrado exitosamente y stock actualizado.',
      movimientoId: movResult.insertId,
      nuevoStock: nuevoStock
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('Error en transacción de movimiento:', error);
    return res.status(500).json({ message: 'Error al registrar el movimiento de stock.', error: error.message });
  } finally {
    connection.release();
  }
}
