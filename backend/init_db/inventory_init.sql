CREATE DATABASE IF NOT EXISTS inventory_db;
USE inventory_db;

-- Tabla: productos (con soporte JSON para simular flexibilidad NoSQL)
CREATE TABLE IF NOT EXISTS productos (
  id_producto INT AUTO_INCREMENT PRIMARY KEY,
  sku VARCHAR(100) NOT NULL UNIQUE,
  nombre VARCHAR(150) NOT NULL,
  descripcion TEXT NULL,
  precio_venta DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  precio_compra DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  stock_actual INT NOT NULL DEFAULT 0,
  stock_minimo INT NOT NULL DEFAULT 0,
  categoria VARCHAR(100) NOT NULL,
  proveedor_id_mysql INT NULL,
  proveedor_nombre_empresa VARCHAR(150) NULL,
  proveedor_telefono_contacto VARCHAR(50) NULL,
  atributos_especificos JSON NULL, -- Guarda color, talla, material, etc.
  alertas_config JSON NULL,        -- Configuración de alertas de stock
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultima_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: inventario_movimientos (traza de auditoría de stock)
CREATE TABLE IF NOT EXISTS inventario_movimientos (
  id_movimiento INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  sku VARCHAR(100) NOT NULL,
  tipo_movimiento ENUM('Entrada', 'Salida', 'Ajuste') NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  cantidad INT NOT NULL,
  stock_resultante_bodega INT NOT NULL,
  ubicacion_bodega VARCHAR(150) NULL,
  ejecutado_por_id_usuario INT NOT NULL, -- ID del usuario autenticado en auth_db
  ejecutado_por_nombre VARCHAR(150) NOT NULL,
  fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (producto_id) REFERENCES productos(id_producto) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar Productos Semilla Iniciales
INSERT INTO productos (id_producto, sku, nombre, descripcion, precio_venta, precio_compra, stock_actual, stock_minimo, categoria, proveedor_id_mysql, proveedor_nombre_empresa, proveedor_telefono_contacto, atributos_especificos, alertas_config, activo)
VALUES
(1, 'POL-BLA-XL-X', 'Polera blanca XL', 'Polera blanca de algodón, talla XL, Marca X', 15000.00, 7500.00, 120, 10, 'Ropa', 10, 'Textiles Sur', '+56911112222', '{"color": "Blanco", "talla": "XL", "material": "Algodón"}', '{"stock_minimo_critico": 10, "stock_maximo_permitido": 500, "notificar_al_correo": true}', 1),
(2, 'POL-NEG-M-X', 'Polera negra M', 'Polera negra de algodón, talla M, Marca X', 15000.00, 7500.00, 4, 10, 'Ropa', 10, 'Textiles Sur', '+56911112222', '{"color": "Negro", "talla": "M", "material": "Algodón"}', '{"stock_minimo_critico": 10, "stock_maximo_permitido": 500, "notificar_al_correo": true}', 1),
(3, 'ZAP-42-Y', 'Zapato seguridad 42', 'Calzado de seguridad de cuero, talla 42, Marca Y', 45000.00, 22000.00, 0, 5, 'Calzado', 11, 'Seguridad Pro', '+56933334444', '{"color": "Negro", "talla": "42", "material": "Cuero"}', '{"stock_minimo_critico": 5, "stock_maximo_permitido": 100, "notificar_al_correo": true}', 1),
(4, 'PAN-AZU-L-Z', 'Pantalón azul L', 'Jeans de trabajo azul, talla L, Marca Z', 25000.00, 12000.00, 35, 8, 'Ropa', 12, 'Confecciones Z', '+56955556666', '{"color": "Azul", "talla": "L", "material": "Mezclilla"}', '{"stock_minimo_critico": 8, "stock_maximo_permitido": 200, "notificar_al_correo": false}', 1),
(5, 'CAS-S-Y', 'Casco de seguridad S', 'Casco de seguridad amarillo, talla S, Marca Y', 12000.00, 5000.00, 12, 15, 'EPP', 11, 'Seguridad Pro', '+56933334444', '{"color": "Amarillo", "talla": "S", "material": "Plástico reforzado"}', '{"stock_minimo_critico": 15, "stock_maximo_permitido": 150, "notificar_al_correo": true}', 1),
(6, 'GUA-M-Z', 'Guantes de trabajo M', 'Guantes de cabritilla para trabajo, talla M, Marca Z', 8000.00, 3500.00, 50, 20, 'EPP', 12, 'Confecciones Z', '+56955556666', '{"color": "Gris", "talla": "M", "material": "Cuero cabritilla"}', '{"stock_minimo_critico": 20, "stock_maximo_permitido": 300, "notificar_al_correo": false}', 1),
(7, 'ZAP-40-Y', 'Zapato seguridad 40', 'Calzado de seguridad de cuero, talla 40, Marca Y', 45000.00, 22000.00, 0, 5, 'Calzado', 11, 'Seguridad Pro', '+56933334444', '{"color": "Negro", "talla": "40", "material": "Cuero"}', '{"stock_minimo_critico": 5, "stock_maximo_permitido": 100, "notificar_al_correo": true}', 0)
ON DUPLICATE KEY UPDATE sku=VALUES(sku);

-- Semilla de Movimientos de Inventario
INSERT INTO inventario_movimientos (id_movimiento, producto_id, sku, tipo_movimiento, motivo, cantidad, stock_resultante_bodega, ubicacion_bodega, ejecutado_por_id_usuario, ejecutado_por_nombre)
VALUES
(1, 1, 'POL-BLA-XL-X', 'Entrada', 'Compra a proveedor - Factura #102', 120, 120, 'Estantería A - Sección 1', 1, 'Administrador StockSmart'),
(2, 2, 'POL-NEG-M-X', 'Entrada', 'Compra a proveedor - Factura #102', 10, 10, 'Estantería A - Sección 1', 1, 'Administrador StockSmart'),
(3, 2, 'Salida', 'Venta directa cliente - Boleta #4029', 6, 4, 'Estantería A - Sección 1', 1, 'Administrador StockSmart'),
(4, 4, 'PAN-AZU-L-Z', 'Entrada', 'Ajuste inicial de inventario', 35, 35, 'Estantería B - Sección 2', 1, 'Administrador StockSmart'),
(5, 5, 'CAS-S-Y', 'Entrada', 'Compra a proveedor - Factura #105', 12, 12, 'Estantería C - Sección 1', 1, 'Administrador StockSmart'),
(6, 6, 'GUA-M-Z', 'Entrada', 'Compra a proveedor - Factura #106', 50, 50, 'Estantería C - Sección 2', 1, 'Administrador StockSmart')
ON DUPLICATE KEY UPDATE id_movimiento=VALUES(id_movimiento);
