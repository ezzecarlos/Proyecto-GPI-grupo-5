CREATE DATABASE IF NOT EXISTS auth_db;
USE auth_db;

-- Tabla: empresas
CREATE TABLE IF NOT EXISTS empresas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre_comercial VARCHAR(150) NOT NULL,
  razon_social VARCHAR(150) NOT NULL,
  identificacion_fiscal VARCHAR(50) NOT NULL,
  plan_suscripcion VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  empresa_id INT NOT NULL,
  sucursal_id INT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol ENUM('ADMIN', 'BODEGUERO', 'VENDEDOR') NOT NULL DEFAULT 'VENDEDOR',
  estado ENUM('Activo', 'Inactivo', 'Suspendido') NOT NULL DEFAULT 'Activo',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre_rol ENUM('SuperAdmin', 'Administrador_PYME', 'Operario_Inventario') NOT NULL,
  descripcion TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: usuario_roles (Relación Muchos a Muchos)
CREATE TABLE IF NOT EXISTS usuario_roles (
  id_usuario INT NOT NULL,
  id_rol INT NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: auditoria_accesos
CREATE TABLE IF NOT EXISTS auditoria_accesos (
  id_log INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  direccion_ip VARCHAR(45) NOT NULL,
  dispositivo_navegador VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar Datos de Semilla Iniciales
INSERT INTO empresas (id, nombre_comercial, razon_social, identificacion_fiscal, plan_suscripcion)
VALUES (1, 'PYME StockSmart', 'StockSmart Chile S.A.', '76.123.456-7', 'Premium')
ON DUPLICATE KEY UPDATE nombre_comercial=VALUES(nombre_comercial);

INSERT INTO sucursales (id, empresa_id, nombre, direccion)
VALUES (1, 1, 'Bodega Central Santiago', 'Av. Providencia 1234, Santiago')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre);

-- Semilla para Roles
INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'SuperAdmin', 'Control total de la plataforma SaaS y todas las PYMEs.'),
(2, 'Administrador_PYME', 'Administración completa de la PYME asignada.'),
(3, 'Operario_Inventario', 'Gestión de productos y registro de movimientos de stock.')
ON DUPLICATE KEY UPDATE nombre_rol=VALUES(nombre_rol);

-- Semilla de Usuario: admin@inventario.cl / admin123
-- El hash corresponde a: bcrypt.hashSync('admin123', 10)
INSERT INTO usuarios (id, empresa_id, sucursal_id, nombre_completo, email, password_hash, rol, estado)
VALUES (
  1, 
  1, 
  1, 
  'Administrador StockSmart', 
  'admin@inventario.cl', 
  '$2a$10$tZ2P09Sg4.q4nU30p.kU2OGJ1oX084M4eC6z08aA5uJp6QzS6G6uG', 
  'ADMIN', 
  'Activo'
)
ON DUPLICATE KEY UPDATE email=VALUES(email);

-- Asignar rol Administrador_PYME al usuario administrador inicial
INSERT INTO usuario_roles (id_usuario, id_rol)
VALUES (1, 2)
ON DUPLICATE KEY UPDATE id_rol=VALUES(id_rol);
