-- Scripts de Inicialización para la base de datos de inventario (PostgreSQL)

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'VENDEDOR' -- ADMINISTRADOR, BODEGUERO, VENDEDOR
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand VARCHAR(100),
    category VARCHAR(100),
    stock INTEGER DEFAULT 0,
    "minStock" INTEGER DEFAULT 0,
    active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS movements (
    id SERIAL PRIMARY KEY,
    "productId" INTEGER REFERENCES products(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'Entrada', 'Salida', 'Ajuste'
    qty INTEGER NOT NULL,
    before INTEGER NOT NULL,
    after INTEGER NOT NULL,
    "userName" VARCHAR(255),
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserta los usuarios de prueba. La contraseña es 'admin123'
-- El hash corresponde a: bcrypt.hashSync('admin123', 10)
INSERT INTO users (id, email, password, name, role) VALUES 
(1, 'admin@inventario.cl', '$2a$10$DgtIRWB.eFpx42EeurzFruBrHNlAY7gIeSBWb3/WJ9hDghkd737hy', 'Administrador', 'ADMINISTRADOR'),
(2, 'bodeguero@inventario.cl', '$2a$10$DgtIRWB.eFpx42EeurzFruBrHNlAY7gIeSBWb3/WJ9hDghkd737hy', 'Bodeguero Stock', 'BODEGUERO'),
(3, 'vendedor@inventario.cl', '$2a$10$DgtIRWB.eFpx42EeurzFruBrHNlAY7gIeSBWb3/WJ9hDghkd737hy', 'Vendedor Tienda', 'VENDEDOR')
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password = EXCLUDED.password, name = EXCLUDED.name, role = EXCLUDED.role;

-- Insertar Productos Semilla Iniciales
INSERT INTO products (id, code, name, brand, category, stock, "minStock", active) VALUES
(1, 'POL-BLA-XL-X', 'Polera blanca XL', 'Marca X', 'Ropa', 120, 10, true),
(2, 'POL-NEG-M-X', 'Polera negra M', 'Marca X', 'Ropa', 4, 10, true),
(3, 'ZAP-42-Y', 'Zapato seguridad 42', 'Marca Y', 'Calzado', 0, 5, true),
(4, 'PAN-AZU-L-Z', 'Pantalón azul L', 'Marca Z', 'Ropa', 35, 8, true),
(5, 'CAS-S-Y', 'Casco de seguridad S', 'Marca Y', 'EPP', 12, 15, true),
(6, 'GUA-M-Z', 'Guantes de trabajo M', 'Marca Z', 'EPP', 50, 20, true),
(7, 'ZAP-40-Y', 'Zapato seguridad 40', 'Marca Y', 'Calzado', 0, 5, false)
ON CONFLICT (id) DO UPDATE SET 
    code = EXCLUDED.code, 
    name = EXCLUDED.name, 
    brand = EXCLUDED.brand, 
    category = EXCLUDED.category, 
    stock = EXCLUDED.stock, 
    "minStock" = EXCLUDED."minStock", 
    active = EXCLUDED.active;

-- Semilla de Movimientos de Inventario
INSERT INTO movements (id, "productId", type, qty, before, after, "userName", note, created_at) VALUES
(1, 1, 'Entrada', 120, 0, 120, 'Administrador', 'Compra a proveedor - Factura #102', '2026-05-28 14:32:00'),
(2, 2, 'Entrada', 10, 0, 10, 'Administrador', 'Compra a proveedor - Factura #102', '2026-05-26 16:48:00'),
(3, 2, 'Salida', 6, 10, 4, 'Administrador', 'Venta directa cliente - Boleta #4029', '2026-05-27 10:15:00'),
(4, 4, 'Entrada', 35, 0, 35, 'Administrador', 'Ajuste inicial de inventario', '2026-05-25 09:20:00'),
(5, 5, 'Entrada', 12, 0, 12, 'Administrador', 'Compra a proveedor - Factura #105', '2026-05-24 11:05:00'),
(6, 6, 'Entrada', 50, 0, 50, 'Administrador', 'Compra a proveedor - Factura #106', '2026-05-23 13:40:00')
ON CONFLICT (id) DO UPDATE SET 
    "productId" = EXCLUDED."productId", 
    type = EXCLUDED.type, 
    qty = EXCLUDED.qty, 
    before = EXCLUDED.before, 
    after = EXCLUDED.after, 
    "userName" = EXCLUDED."userName", 
    note = EXCLUDED.note,
    created_at = EXCLUDED.created_at;

-- Sincronizar secuencias para PostgreSQL
SELECT setval(pg_get_serial_sequence('users', 'id'), coalesce(max(id), 1)) FROM users;
SELECT setval(pg_get_serial_sequence('products', 'id'), coalesce(max(id), 1)) FROM products;
SELECT setval(pg_get_serial_sequence('movements', 'id'), coalesce(max(id), 1)) FROM movements;
