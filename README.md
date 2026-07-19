# 🚌 BusWay — Plataforma de Transporte Escolar Digital

> **Proyecto de Tópicos de Software**
> Plataforma móvil y web de transporte escolar seguro, optimizada con rastreo satelital en tiempo real, verificación por asistencia QR, pagos automatizados mediante Stripe y OCR para validación de conductores.

---

## 📋 Arquitectura y Funcionamiento

BusWay consta de tres componentes principales:
1. **Backend (`be/`):** API REST construida con **Node.js, Express y MongoDB (Mongoose)**. Administra la lógica de negocio, autenticación de Firebase, procesamiento de pagos con Stripe y comunicación en tiempo real a través de **WebSockets (Socket.io)**.
2. **Aplicación Móvil (`mobile/`):** Desarrollada en **React Native con Expo**. Incluye dos interfaces diferenciadas según el rol del usuario:
   * **Conductor:** Permite gestionar la lista de estudiantes, iniciar/finalizar recorridos, marcar asistencias manualmente o por escáner de códigos QR, y geolocalizar el bus en tiempo real.
   * **Padre:** Permite buscar y contratar conductores en el Marketplace, autorizar contratos de pago recurrentes en Stripe, registrar la ubicación de recogida y monitorear la ruta del bus en vivo con notificaciones push personalizadas.
3. **Sitio Web (`web/`):** Panel administrativo del sistema.

---

## ⚡ Funcionalidades Clave (Esenciales para Entender)

Para tu examen de **Tópicos de Software**, es fundamental comprender estos flujos lógicos clave implementados en el código:

### 1. Seguimiento en Tiempo Real (WebSockets)
* El canal de comunicación se gestiona en [socketHandler.js](file:///be/sockets/socketHandler.js).
* Cuando el chofer inicia una ruta, el móvil emite `join:ruta` con las credenciales correspondientes.
* El backend transmite la ubicación periódicamente del conductor a la sala de la ruta (`sala:ruta:ID_RUTA`), y la app del padre recibe y dibuja la posición del vehículo en un mapa interactivo.

### 2. Auto-Cancelación de Viaje (Regla de Negocio)
* Si todos los estudiantes de una ruta son marcados como **ausentes** (ya sea manualmente por el chofer o mediante la app del padre), la ruta **se finaliza automáticamente** en el backend para evitar consumos de API de mapas innecesarios.
* El sistema notifica a la app del chofer (error `TODOS_AUSENTES`) y detiene la jornada marcando el viaje como `finalizado`.

### 3. Pasarela de Pagos Stripe & Autocuración (Self-Healing)
* Los pagos se manejan mediante suscripciones recurrentes mensuales en Stripe ([stripe.js](file:///be/routes/stripe.js)).
* **Resiliencia de Clientes (Self-Healing):** Si las llaves de Stripe cambian o se limpia la base de datos de desarrollo y el `stripe_customer_id` de Mongoose queda desactualizado, el backend detecta el error en el try/catch (ej: *No such customer*), crea automáticamente un nuevo cliente en Stripe, lo vincula a la cuenta local en caliente, y continúa con el pago sin lanzar errores 500 al usuario.
* **Control Multihijo Independiente:** Si un padre tiene varios hijos en colegiales diferentes con contratos independientes, el sistema verifica las suscripciones por estudiante. Si solo se pagó la mensualidad de un hijo, el padre solo podrá ver el mapa en vivo de ese estudiante en particular; la vista del hijo con mensualidad impaga permanecerá bloqueada bajo el aviso de cobro pendiente.

---

## 🛠️ Requisitos Previos y Herramientas

Instalar antes de arrancar el desarrollo:

| Herramienta | Versión Recomendada | Enlace de Descarga |
|---|---|---|
| **Node.js** | 18.x o superior | [nodejs.org](https://nodejs.org) |
| **MongoDB Community** | 7.x | [mongodb.com/try/download/community](https://mongodb.com/try/download/community) |
| **MongoDB Compass** | Última versión | [mongodb.com/products/tools/compass](https://mongodb.com/products/tools/compass) |
| **Expo Go** | Descargar en celular (Android/iOS) | App Store o Google Play Store |
| **Git CLI** | Última versión | [git-scm.com](https://git-scm.com) |

---

## ⚙️ Configuración del Entorno de Desarrollo

### 1. Clonar el repositorio
Abre una terminal en tu computadora y clona el proyecto en tu carpeta de preferencia:
```bash
git clone https://github.com/MonicaS17/busway-topicos.git
cd busway-topicos
```

### 2. Instalar Dependencias (Excluidas en Git)
Dado que los paquetes pesados de Node.js no se suben al control de versiones, debes instalarlos de forma independiente en ambas carpetas:

* **Instalar backend:**
  ```bash
  cd be
  npm install
  ```
* **Instalar aplicación móvil:**
  ```bash
  cd ../mobile
  npm install --legacy-peer-deps
  ```

---

## 📄 Archivos de Configuración (`.env` y Credenciales)

Crea y configura los siguientes archivos locales de configuración en tu entorno:

### Backend (`be/.env`)
Crea un archivo `.env` en la carpeta `be/` con la siguiente estructura:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/busway
STRIPE_SECRET_KEY=sk_test_...   # Llave secreta de tu Stripe Dashboard en modo de prueba
STRIPE_WEBHOOK_SECRET=whsec_... # Opcional: para procesar firmas de webhooks de facturación local
```

> [!IMPORTANT]
> **Autenticación con Firebase:** Necesitas el archivo de credenciales de servicio `serviceAccount.json` de Firebase. Solicita este archivo a Mónica y colócalo dentro de la carpeta `be/` (este archivo está en el `.gitignore` por motivos de seguridad y no debe subirse a GitHub).

### Mobile (`mobile/.env`)
Crea un archivo `.env` en la carpeta `mobile/` con la siguiente estructura:
```env
EXPO_PUBLIC_API_URL=http://TU_IP_LOCAL:3000
EXPO_PUBLIC_GOOGLE_VISION_KEY=AIzaSy... # Clave de API de Google Vision para el OCR de Cédulas
```

> [!TIP]
> **Cómo obtener tu IP local (Windows):**
> 1. Abre PowerShell o CMD.
> 2. Escribe `ipconfig` y presiona Enter.
> 3. Copia tu dirección IPv4 (ej: `192.168.1.15`).
> 4. Tu celular con **Expo Go** y tu computadora con el backend **deben estar conectados a la misma red WiFi** para que la app móvil pueda comunicarse con tu servidor local.

---

## 🚀 Ejecución del Proyecto

### Paso 1: Iniciar el Servidor Backend
Con tu base de datos MongoDB local corriendo de fondo (puedes verificarla abriendo MongoDB Compass en `mongodb://localhost:27017`):

1. Posiciónate en la carpeta `be/`:
   ```bash
   cd be
   ```
2. Ejecuta el servidor:
   ```bash
   node server.js
   ```
   *Deberás ver el mensaje:*
   `Conectado a MongoDB ✅`
   `Servidor corriendo en puerto 3000 ✅`

### Paso 2: Levantar el Entorno Móvil (Expo)
1. Abre una nueva terminal en la carpeta `mobile/`:
   ```bash
   cd mobile
   ```
2. Inicia el bundler de Expo:
   ```bash
   npx expo start
   ```
3. Escanea el código QR que se imprime en tu terminal utilizando la aplicación **Expo Go** en tu celular para ver y probar la interfaz en tiempo real.

---

## 🗄️ Semillas e Información de Prueba
La base de datos utilizará las siguientes colecciones:
`usuarios`, `vehiculos`, `solicitudes`, `acuerdos`, `rutas`, `viajes`, `pagos`, `notificaciones`, `resenas` y `escuelas`.

Para poblar y re-establecer tu base de datos de desarrollo con datos de prueba preestablecidos, revisa los scripts dentro de `be/seeds/` en tu entorno local.