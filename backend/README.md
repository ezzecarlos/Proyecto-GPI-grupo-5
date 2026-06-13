# StockSmart Backend - API de Gestión de Inventario (SaaS)

Este es el backend de la plataforma **StockSmart**, un sistema SaaS de gestión de inventarios para PYMEs. Está diseñado utilizando una arquitectura modular con **Node.js**, **Express**, **TypeScript**, y base de datos relacional **MySQL**.

---

## 🚀 Arquitectura y Tecnologías
- **Runtime:** Node.js (v20+)
- **Framework:** Express con TypeScript
- **Bases de Datos (MySQL):** Arquitectura aislada de bases de datos para garantizar escalabilidad:
  - **`auth_db`**: Base de datos de autenticación, control de accesos, empresas y roles.
  - **`inventory_db`**: Base de datos de inventario, productos (con soporte JSON para atributos dinámicos) y movimientos.
- **Contenedores:** Docker & Docker Compose
- **ORM / Driver:** `mysql2/promise` (consultas nativas preparadas de alto rendimiento)
- **Seguridad:** JWT (JSON Web Tokens) y cifrado de contraseñas con BcryptJS

---

## 🛠️ Requisitos Previos
Asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (versión 20 o superior recomendada)
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)

---

## 📦 Configuración Inicial y Despliegue con Docker

El proyecto viene preparado para levantarse por completo en un entorno contenedorizado, incluyendo las dos bases de datos MySQL, el servidor Backend y una interfaz de administración de bases de datos (phpMyAdmin).

### 1. Variables de Entorno (`.env`)
Asegúrate de tener configurado tu archivo `.env` en la raíz del directorio `/backend`. Un ejemplo de configuración:

```env
PORT=5000
JWT_SECRET=stocksmart_jwt_secret_key_2026_xyz

# Base de Datos de Autenticación
AUTH_DB_HOST=auth-db
AUTH_DB_PORT=3306
AUTH_DB_USER=auth_user
AUTH_DB_PASSWORD=auth_password
AUTH_DB_NAME=auth_db
AUTH_DB_ROOT_PASSWORD=auth_root_password

# Base de Datos de Inventario
INVENTORY_DB_HOST=inventory-db
INVENTORY_DB_PORT=3306
INVENTORY_DB_USER=inventory_user
INVENTORY_DB_PASSWORD=inventory_password
INVENTORY_DB_NAME=inventory_db
INVENTORY_DB_ROOT_PASSWORD=inventory_root_password
```

> [!NOTE]
> Cuando ejecutes el backend a través de **Docker Compose**, la API se conectará a las bases de datos usando los nombres de servicio internos (`auth-db` e `inventory-db`) como hosts. Si estás ejecutando el backend de forma local fuera de Docker, cambia los hosts a `localhost` y los puertos correspondientes (`3307` para Auth y `3308` para Inventario).

### 2. Levantar la Aplicación
Ejecuta el siguiente comando en la terminal desde el directorio `/backend`:

```bash
docker-compose up --build -d
```

Esto levantará los siguientes servicios:
1. **`auth-db`**: MySQL expuesto en el puerto `3307` de tu host local.
2. **`inventory-db`**: MySQL expuesto en el puerto `3308` de tu host local.
3. **`backend-api`**: Servidor Express expuesto en el puerto `5000` de tu host local.
4. **`phpmyadmin`**: Gestor web expuesto en el puerto `8080` de tu host local.

---

## 🔌 Datos de Conexión a las Bases de Datos (Docker)

Si necesitas acceder a las bases de datos desde un cliente de base de datos externo (como DBeaver, MySQL Workbench, VS Code Database Client, etc.), utiliza los siguientes parámetros:

### 🔐 1. Base de Datos de Autenticación (`auth_db`)
- **Host:** `localhost` (o `127.0.0.1`)
- **Puerto:** `3307` (Mapeado desde el puerto interno 3306)
- **Base de Datos:** `auth_db`
- **Usuario Común:** `auth_user`
- **Contraseña Común:** `auth_password`
- **Usuario Administrador:** `root`
- **Contraseña Administrador:** `auth_root_password`

### 📦 2. Base de Datos de Inventarios (`inventory_db`)
- **Host:** `localhost` (o `127.0.0.1`)
- **Puerto:** `3308` (Mapeado desde el puerto interno 3306)
- **Base de Datos:** `inventory_db`
- **Usuario Común:** `inventory_user`
- **Contraseña Común:** `inventory_password`
- **Usuario Administrador:** `root`
- **Contraseña Administrador:** `inventory_root_password`

---

## 🌐 Interfaz Web phpMyAdmin
Puedes gestionar visualmente ambas bases de datos ingresando en tu navegador web a:
- **URL:** [http://localhost:8080](http://localhost:8080)

Al ingresar, selecciona el servidor en el campo de servidor correspondiente en phpMyAdmin:
- **Servidor Auth:** `auth-db` (Usuario: `auth_user` / Contraseña: `auth_password`)
- **Servidor Inventario:** `inventory-db` (Usuario: `inventory_user` / Contraseña: `inventory_password`)

---

## 🛠️ Ejecución en Modo Desarrollo (Local sin Docker)
Si deseas realizar cambios en caliente en el backend sin construir la imagen de Docker constantemente:

1. **Instalar dependencias:**
   ```bash
   npm install
   ```

2. **Asegurar base de datos levantada:**
   Puedes dejar corriendo solo los contenedores de base de datos de Docker:
   ```bash
   docker-compose up auth-db inventory-db phpmyadmin -d
   ```

3. **Modificar `.env` para ejecución local:**
   En tu archivo `.env`, cambia los hosts para apuntar a tu localhost y a los puertos expuestos de Docker:
   ```env
   AUTH_DB_HOST=localhost
   AUTH_DB_PORT=3307
   
   INVENTORY_DB_HOST=localhost
   INVENTORY_DB_PORT=3308
   ```

4. **Correr servidor de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor se iniciará en [http://localhost:5000](http://localhost:5000) con recarga automática mediante `ts-node-dev`.

---

## 📑 Resumen de la API (Endpoints)

Todas las peticiones a rutas protegidas requieren el encabezado:
`Authorization: Bearer <JWT_TOKEN>`

### 🔑 Autenticación (`/api/auth`)
* `POST /login` - Iniciar sesión (Devuelve token JWT y datos del usuario).
  - *Usuario Semilla:* `admin@inventario.cl`
  - *Contraseña Semilla:* `admin123`
* `GET /me` - Obtener información del usuario autenticado (Protegido).

### 📦 Productos (`/api/products`)
*(Todas las rutas requieren autenticación)*
* `GET /` - Obtener todos los productos activos (Filtros opcionales por query: `category`, `status`, `search`).
* `GET /:id` - Obtener detalle de un producto por ID.
* `POST /` - Registrar un nuevo producto.
* `PUT /:id` - Actualizar información de un producto.
* `DELETE /:id` - Eliminación lógica (desactivación) de un producto.

### 🔄 Movimientos de Inventario (`/api/movements`)
*(Todas las rutas requieren autenticación)*
* `GET /` - Listar historial de movimientos (Entradas, Salidas y Ajustes).
* `POST /` - Registrar un movimiento de stock.
