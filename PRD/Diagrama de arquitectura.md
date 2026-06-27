# BusWay Unified Full Stack JavaScript Architecture

```mermaid
flowchart LR

%% ===========================
%% CLIENT LAYER
%% ===========================
subgraph CL["Client Layer"]

    Mobile["📱 Mobile App<br/>React Native + Expo<br/><br/>• Parents<br/>• Drivers<br/>• GPS<br/>• QR<br/>• Notifications"]

    Web["💻 Web Portal<br/>Next.js 14<br/><br/>• Parents<br/>• Admins<br/>• Info<br/>• Account Management"]

end

%% ===========================
%% APPLICATION LAYER
%% ===========================
subgraph APP["Application Layer"]

    API["REST API<br/>Node.js + Express<br/><br/>• Business Logic<br/>• JWT Authentication"]

    Socket["Real-Time Server<br/>Socket.io<br/><br/>• Live GPS Tracking"]

end

%% ===========================
%% DATA LAYER
%% ===========================
subgraph DATA["Data Layer"]

    Mongo["MongoDB<br/>Mongoose ODM<br/><br/>Collections:<br/>• Users<br/>• Routes<br/>• Attendance<br/>• Payments"]

end

%% ===========================
%% EXTERNAL SERVICES
%% ===========================
subgraph EXT["External Services"]

    Cloudinary["Cloudinary<br/>Docs & Images"]

    Stripe["Stripe<br/>Payments"]

    FCM["Firebase Cloud Messaging<br/>Push Notifications"]

    Firebase["Firebase Authentication<br/>Login • Tokens • Recovery"]

end

%% ===========================
%% CLIENT → API
%% ===========================
Mobile -->|HTTP<br/>JWT Auth + CRUD| API
Web -->|HTTP<br/>JWT Auth + CRUD| API

%% CLIENT → SOCKET
Mobile -->|WebSocket<br/>Live GPS| Socket

%% API → DATABASE
API -->|Read / Write<br/>Mongoose| Mongo

%% API → EXTERNAL SERVICES
API -. Authentication API .-> Firebase
API -. Docs & Images API .-> Cloudinary
API -. Payments API .-> Stripe
API -. Push Notifications .-> FCM
```

---

# Arquitectura por Capas

## 1. Client Layer

### Mobile App
- Framework: React Native + Expo
- Funcionalidades:
  - Padres
  - Conductores
  - GPS en tiempo real
  - Escaneo QR
  - Notificaciones Push

### Web Portal
- Framework: Next.js 14
- Funcionalidades:
  - Padres
  - Administradores
  - Información
  - Gestión de cuentas

---

## 2. Application Layer

### REST API
Tecnologías:

- Node.js
- Express

Responsabilidades:

- Lógica de negocio
- CRUD
- Autenticación JWT

### Real-Time Server

Tecnología:

- Socket.io

Responsabilidades:

- Seguimiento GPS en tiempo real mediante WebSockets.

---

## 3. Data Layer

### MongoDB

Acceso mediante:

- Mongoose ODM

Colecciones:

- Users
- Routes
- Attendance
- Payments

---

## 4. External Services

### Firebase Authentication

Responsabilidades:

- Login
- Tokens
- Recuperación de contraseña

---

### Firebase Cloud Messaging

Responsabilidades:

- Notificaciones Push

---

### Cloudinary

Responsabilidades:

- Almacenamiento de documentos
- Gestión de imágenes

---

### Stripe

Responsabilidades:

- Procesamiento de pagos

---

# Flujo General

```text
Mobile App
        │
        ├──────── HTTP (JWT + CRUD)
        │
Web Portal
        │
        ▼
    REST API (Node.js + Express)
        │
        ├──────── MongoDB (Mongoose)
        ├──────── Firebase Auth
        ├──────── Stripe
        ├──────── Cloudinary
        └──────── Firebase Cloud Messaging

Mobile App
        │
        └──────── WebSocket
                     │
                     ▼
              Socket.io Server
                     │
               Live GPS Tracking
```

# Tecnologías

| Capa | Tecnología |
|-------|------------|
| Mobile | React Native + Expo |
| Web | Next.js 14 |
| Backend | Node.js |
| API | Express |
| Tiempo Real | Socket.io |
| Base de Datos | MongoDB |
| ODM | Mongoose |
| Autenticación | JWT + Firebase Auth |
| Archivos | Cloudinary |
| Pagos | Stripe |
| Notificaciones | Firebase Cloud Messaging |