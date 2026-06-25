-- Scripts de Inicialización para la base de datos de autenticación (PostgreSQL)
-- NOTA: El backend actual de StockSmart no utiliza esta base de datos en su versión actual,
-- pero se mantiene estructurada en sintaxis compatible con PostgreSQL para coherencia futura.

-- Tabla: empresas
CREATE TABLE IF NOT EXISTS empresas (
  id SERIAL PRIMARY KEY,
  nombre_comercial VARCHAR(150) NOT NULL,
  razon_social VARCHAR(150) NOT NULL,
  identificacion_fiscal VARCHAR(50) NOT NULL,
  plan_suscripcion VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: sucursales
CREATE TABLE IF NOT EXISTS sucursales (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  nombre VARCHAR(100) NOT NULL,
  direccion VARCHAR(255) NOT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE
);

-- Tabla: usuarios
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  empresa_id INT NOT NULL,
  sucursal_id INT NULL,
  nombre_completo VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  rol VARCHAR(50) NOT NULL DEFAULT 'VENDEDOR', -- ROL: ADMIN, BODEGUERO, VENDEDOR
  estado VARCHAR(50) NOT NULL DEFAULT 'Activo', -- ESTADO: Activo, Inactivo, Suspendido
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ultimo_acceso TIMESTAMP NULL DEFAULT NULL,
  FOREIGN KEY (empresa_id) REFERENCES empresas(id) ON DELETE CASCADE,
  FOREIGN KEY (sucursal_id) REFERENCES sucursales(id) ON DELETE SET NULL
);

-- Tabla: roles
CREATE TABLE IF NOT EXISTS roles (
  id_rol SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(50) NOT NULL, -- SuperAdmin, Administrador_PYME, Operario_Inventario
  descripcion TEXT NULL
);

-- Tabla: usuario_roles (Relación Muchos a Muchos)
CREATE TABLE IF NOT EXISTS usuario_roles (
  id_usuario INT NOT NULL,
  id_rol INT NOT NULL,
  PRIMARY KEY (id_usuario, id_rol),
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY (id_rol) REFERENCES roles(id_rol) ON DELETE CASCADE
);

-- Tabla: auditoria_accesos
CREATE TABLE IF NOT EXISTS auditoria_accesos (
  id_log SERIAL PRIMARY KEY,
  id_usuario INT NOT NULL,
  fecha_ingreso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  direccion_ip VARCHAR(45) NOT NULL,
  dispositivo_navegador VARCHAR(255) NOT NULL,
  FOREIGN KEY (id_usuario) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Insertar Datos de Semilla Iniciales
INSERT INTO empresas (id, nombre_comercial, razon_social, identificacion_fiscal, plan_suscripcion)
VALUES (1, 'PYME StockSmart', 'StockSmart Chile S.A.', '76.123.456-7', 'Premium')
ON CONFLICT (id) DO UPDATE SET nombre_comercial = EXCLUDED.nombre_comercial;

INSERT INTO sucursales (id, empresa_id, nombre, direccion)
VALUES (1, 1, 'Bodega Central Santiago', 'Av. Providencia 1234, Santiago')
ON CONFLICT (id) DO UPDATE SET nombre = EXCLUDED.nombre;

-- Semilla para Roles
INSERT INTO roles (id_rol, nombre_rol, descripcion) VALUES
(1, 'SuperAdmin', 'Control total de la plataforma SaaS y todas las PYMEs.'),
(2, 'Administrador_PYME', 'Administración completa de la PYME asignada.'),
(3, 'Operario_Inventario', 'Gestión de productos y registro de movimientos de stock.')
ON CONFLICT (id_rol) DO UPDATE SET nombre_rol = EXCLUDED.nombre_rol;

-- Semilla de Usuario: admin@inventario.cl / admin123
-- El hash corresponde a: bcrypt.hashSync('admin123', 10)
INSERT INTO usuarios (id, empresa_id, sucursal_id, nombre_completo, email, password_hash, rol, estado)
VALUES (
  1, 
  1, 
  1, 
  'Administrador StockSmart', 
  'admin@inventario.cl', 
  '$2a$10$DgtIRWB.eFpx42EeurzFruBrHNlAY7gIeSBWb3/WJ9hDghkd737hy', 
  'ADMIN', 
  'Activo'
)
ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash;

-- Asignar rol Administrador_PYME al usuario administrador inicial
INSERT INTO usuario_roles (id_usuario, id_rol)
VALUES (1, 2)
ON CONFLICT (id_usuario, id_rol) DO UPDATE SET id_rol = EXCLUDED.id_rol;

-- Sincronizar secuencias
SELECT setval(pg_get_serial_sequence('empresas', 'id'), coalesce(max(id), 1)) FROM empresas;
SELECT setval(pg_get_serial_sequence('sucursales', 'id'), coalesce(max(id), 1)) FROM sucursales;
SELECT setval(pg_get_serial_sequence('usuarios', 'id'), coalesce(max(id), 1)) FROM usuarios;
SELECT setval(pg_get_serial_sequence('roles', 'id_rol'), coalesce(max(id_rol), 1)) FROM roles;
SELECT setval(pg_get_serial_sequence('auditoria_accesos', 'id_log'), coalesce(max(id_log), 1)) FROM auditoria_accesos;
