# 🚌 BusWay — Transporte Escolar Digital
> *tus hijos seguros en cada ruta*

Plataforma digital de transporte escolar para Panamá. Permite a los padres monitorear en tiempo real la ruta del bus, verificar la asistencia de sus hijos mediante códigos QR y gestionar pagos automáticos.

---

## Estructura del proyecto

```
busway/
├── be/          → Backend (Node.js + Express + MongoDB)
├── mobile/      → App móvil (React Native + Expo)
└── web/         → Sitio web (React) — próximamente
```

---

## Requisitos previos

Instalar esto antes de empezar:

| Herramienta | Versión | Descarga |
|---|---|---|
| Node.js | 18+ | https://nodejs.org |
| MongoDB Community | 7.x | https://www.mongodb.com/try/download/community |
| MongoDB Compass | Última | https://www.mongodb.com/products/tools/compass |
| Expo Go (celular) | Última | Play Store / App Store |
| Git | Última | https://git-scm.com |

---

## Variables de entorno:

### Backend (`be/.env`)

Crea un archivo `.env` dentro de la carpeta `be` con esto:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/busway
```

> ⚠️ El archivo `serviceAccount.json` de Firebase lo pide Mónica — no se sube a GitHub por seguridad.

### Mobile (`mobile/.env`)

Crea un archivo `.env` dentro de la carpeta `mobile` con esto:

```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
EXPO_PUBLIC_GOOGLE_VISION_KEY=TU_CLAVE_AQUI
```

> ⚠️ La clave de Google Vision la tiene Mónica. La IP local cambia según tu red WiFi — mira cómo obtenerla abajo.

---

## Archivos secretos (pídelos a Mónica)

Estos archivos **no están en GitHub** por seguridad. Pídelos por WhatsApp:

- `be/serviceAccount.json` → credenciales de Firebase Admin
- La clave de Google Vision API → va en `mobile/.env`
---

## Cómo ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/TU_USUARIO/busway.git
cd busway
```

### 2. Configurar el Backend

```bash
cd be
npm install
```

Crea el archivo `be/.env` con las variables de arriba y copia el `serviceAccount.json` dentro de `be/`.

Luego ejecuta:

```bash
node server.js
```

Deberías ver:
```
Conectado a MongoDB ✅
Servidor corriendo en puerto 3000 ✅
```

### 3. Configurar la App Móvil

```bash
cd ../mobile
npm install --legacy-peer-deps
```

Crea el archivo `mobile/.env` con las variables de arriba.

**Obtener tu IP local:**

```bash
# Windows
ipconfig
# Busca "IPv4 Address" en el adaptador Wi-Fi
# Ejemplo: 192.168.1.5
```

Luego ejecuta:

```bash
npx expo start
```

Escanea el QR con **Expo Go** en tu celular.

> Tu celular y tu computadora deben estar en la **misma red WiFi**.

---

## Cómo probar la app

1. Abre **Expo Go** en tu celular
2. Escanea el QR que aparece en la terminal
3. Prueba el registro como conductor o padre
4. Para el OCR de cédula necesitas buena iluminación

---

## Base de datos

La BD se llama `busway` y corre localmente en MongoDB.

**Colecciones:**
`usuarios` · `vehiculos` · `solicitudes` · `acuerdos` · `rutas` · `viajes` · `pagos` · `notificaciones` · `resenas` · `logs` · `escuelas`

Para verla abre **MongoDB Compass** y conéctate a:
```
mongodb://localhost:27017
```

---

## Stack tecnológico

| Capa | Tecnología |
|---|---|
| App móvil | React Native + Expo |
| Backend | Node.js + Express |
| Base de datos | MongoDB + Mongoose |
| Autenticación | Firebase Authentication |
| OCR cédula | Google Cloud Vision API |
| Pagos | Stripe |
| Almacenamiento | Cloudinary |
| Notificaciones | Firebase Cloud Messaging |

---