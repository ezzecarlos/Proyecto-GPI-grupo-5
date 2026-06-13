import { Response } from 'express';
import { inventoryDbPool } from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

// Obtener todos los productos activos
export async function getAllProducts(req: AuthenticatedRequest, res: Response) {
  try {
    const { category, status, search } = req.query;

    let query = `
      SELECT 
        id_producto as id, 
        sku as code, 
        nombre as name, 
        descripcion,
        precio_venta,
        precio_compra,
        stock_actual as stock, 
        stock_minimo as minStock, 
        categoria, 
        proveedor_id_mysql,
        proveedor_nombre_empresa,
        proveedor_telefono_contacto,
        atributos_especificos,
        alertas_config,
        activo,
        fecha_registro,
        ultima_actualizacion,
        CASE 
          WHEN stock_actual = 0 THEN 'Sin stock'
          WHEN stock_actual < stock_minimo THEN 'Stock bajo'
          ELSE 'Disponible'
        END as status
      FROM productos 
      WHERE activo = 1
    `;
    const params: any[] = [];

    if (category && category !== 'Todas') {
      query += ' AND categoria = ?';
      params.push(category);
    }

    if (search) {
      query += ' AND (sku LIKE ? OR nombre LIKE ? OR categoria LIKE ?)';
      const searchWildcard = `%${search}%`;
      params.push(searchWildcard, searchWildcard, searchWildcard);
    }

    const [rows]: any = await inventoryDbPool.query(query, params);

    // Si hay filtro de estado (procesado en JS para mayor facilidad con la columna dinámica)
    let results = rows;
    if (status && status !== 'Todos') {
      results = rows.filter((r: any) => r.status === status);
    }

    return res.json(results);
  } catch (error: any) {
    console.error('Error al obtener productos:', error);
    return res.status(500).json({ message: 'Error al obtener listado de productos.', error: error.message });
  }
}

// Obtener un producto por ID
export async function getProductById(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const [rows]: any = await inventoryDbPool.query(
      `SELECT *,
        CASE 
          WHEN stock_actual = 0 THEN 'Sin stock'
          WHEN stock_actual < stock_minimo THEN 'Stock bajo'
          ELSE 'Disponible'
        END as status
      FROM productos WHERE id_producto = ? AND activo = 1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    return res.json(rows[0]);
  } catch (error: any) {
    console.error('Error al obtener producto:', error);
    return res.status(500).json({ message: 'Error al obtener el producto.', error: error.message });
  }
}

// Crear un producto
export async function createProduct(req: AuthenticatedRequest, res: Response) {
  const {
    code, // mapeado a sku
    name, // mapeado a nombre
    descripcion,
    precio_venta = 0,
    precio_compra = 0,
    stock = 0, // mapeado a stock_actual
    minStock = 0, // mapeado a stock_minimo
    category, // mapeado a categoria
    proveedor_id_mysql = null,
    proveedor_nombre_empresa = '',
    proveedor_telefono_contacto = '',
    atributos_especificos = {},
    alertas_config = {}
  } = req.body;

  if (!code || !name || !category) {
    return res.status(400).json({ message: 'Código (code), nombre (name) y categoría (category) son requeridos.' });
  }

  try {
    // Verificar si el SKU ya existe
    const [existing]: any = await inventoryDbPool.query('SELECT id_producto FROM productos WHERE sku = ?', [code]);
    if (existing.length > 0) {
      return res.status(400).json({ message: `El código SKU '${code}' ya está registrado.` });
    }

    // Guardar el producto
    const [result]: any = await inventoryDbPool.query(
      `INSERT INTO productos 
        (sku, nombre, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, categoria, proveedor_id_mysql, proveedor_nombre_empresa, proveedor_telefono_contacto, atributos_especificos, alertas_config, activo) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
      [
        code,
        name,
        descripcion || null,
        precio_venta,
        precio_compra,
        stock,
        minStock,
        category,
        proveedor_id_mysql,
        proveedor_nombre_empresa,
        proveedor_telefono_contacto,
        JSON.stringify(atributos_especificos),
        JSON.stringify(alertas_config)
      ]
    );

    // Si el stock inicial es mayor a 0, registrar un movimiento inicial
    if (stock > 0) {
      await inventoryDbPool.query(
        `INSERT INTO inventario_movimientos 
          (producto_id, sku, tipo_movimiento, motivo, cantidad, stock_resultante_bodega, ubicacion_bodega, ejecutado_por_id_usuario, ejecutado_por_nombre) 
        VALUES (?, ?, 'Entrada', 'Ajuste inicial de inventario', ?, ?, 'Bodega Principal', ?, ?)`
        , [
          result.insertId,
          code,
          stock,
          stock,
          req.user?.id || 1,
          req.user?.nombre_completo || 'Sistema'
        ]
      );
    }

    return res.status(201).json({
      message: 'Producto creado exitosamente.',
      productId: result.insertId
    });
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return res.status(500).json({ message: 'Error al registrar el producto.', error: error.message });
  }
}

// Actualizar un producto
export async function updateProduct(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  const {
    name,
    descripcion,
    precio_venta,
    precio_compra,
    minStock,
    category,
    proveedor_nombre_empresa,
    proveedor_telefono_contacto,
    atributos_especificos,
    alertas_config
  } = req.body;

  try {
    // Verificar existencia
    const [existing]: any = await inventoryDbPool.query('SELECT sku FROM productos WHERE id_producto = ? AND activo = 1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: 'Producto no encontrado.' });
    }

    // Construir la consulta dinámicamente
    let updateFields = [];
    let params = [];

    if (name !== undefined) { updateFields.push('nombre = ?'); params.push(name); }
    if (descripcion !== undefined) { updateFields.push('descripcion = ?'); params.push(descripcion); }
    if (precio_venta !== undefined) { updateFields.push('precio_venta = ?'); params.push(precio_venta); }
    if (precio_compra !== undefined) { updateFields.push('precio_compra = ?'); params.push(precio_compra); }
    if (minStock !== undefined) { updateFields.push('stock_minimo = ?'); params.push(minStock); }
    if (category !== undefined) { updateFields.push('categoria = ?'); params.push(category); }
    if (proveedor_nombre_empresa !== undefined) { updateFields.push('proveedor_nombre_empresa = ?'); params.push(proveedor_nombre_empresa); }
    if (proveedor_telefono_contacto !== undefined) { updateFields.push('proveedor_telefono_contacto = ?'); params.push(proveedor_telefono_contacto); }
    if (atributos_especificos !== undefined) { updateFields.push('atributos_especificos = ?'); params.push(JSON.stringify(atributos_especificos)); }
    if (alertas_config !== undefined) { updateFields.push('alertas_config = ?'); params.push(JSON.stringify(alertas_config)); }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No se enviaron campos para actualizar.' });
    }

    params.push(id);
    await inventoryDbPool.query(
      `UPDATE productos SET ${updateFields.join(', ')} WHERE id_producto = ?`,
      params
    );

    return res.json({ message: 'Producto actualizado correctamente.' });
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return res.status(500).json({ message: 'Error al actualizar el producto.', error: error.message });
  }
}

// Desactivar un producto (Soft Delete)
export async function deleteProduct(req: AuthenticatedRequest, res: Response) {
  const { id } = req.params;
  try {
    const [result]: any = await inventoryDbPool.query(
      'UPDATE productos SET activo = 0 WHERE id_producto = ? AND activo = 1',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Producto no encontrado o ya inactivo.' });
    }

    return res.json({ message: 'Producto desactivado exitosamente.' });
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return res.status(500).json({ message: 'Error al desactivar el producto.', error: error.message });
  }
}
