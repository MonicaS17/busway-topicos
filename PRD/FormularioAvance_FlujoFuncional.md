**FORMULARIO DEL FLUJO FUNCIONAL**

# **1\. Información General del Proyecto**

**Nombre del Proyecto: BusWay**

**Descripción general del sistema:**

BusWay es una plataforma digital de transporte escolar para Panamá que conecta a padres de familia con conductores verificados. La app móvil permite el seguimiento GPS en tiempo real de la ruta del bus, el control de asistencia mediante códigos QR únicos por estudiante y la gestión de pagos automáticos mensuales a través de Stripe. El sitio web incluye una landing page informativa y un panel exclusivo para el administrador del sistema.

# **2\. Integrantes del equipo de trabajo**

| Nombre y Apellido | Cédula | Rol | Aporte en el Desarrollo del Proyecto |
| :---: | :---: | :---: | :---: |
| Coronado, Liliana | 6-727-983 | Desarrolladora | Investigación, diseño de BD y módulo de pagos |
| Pimentel, Yarlenis | 4-828-1122 | Desarrolladora | Módulo de notificaciones y seguimiento GPS |
| Sánchez, Grace | 8-1033-248 | Desarrolladora | Módulo de marketplace y solicitudes |
| Serrano, Mónica | 8-1020-102 | Desarrolladora | Arquitectura del sistema, autenticación, OCR y panel web |

# **3\. Objetivo del Sistema**

BusWay tiene como objetivo principal digitalizar y hacer más seguro el transporte escolar en Panamá, conectando a padres de familia con conductores verificados mediante una plataforma móvil y web. El sistema busca:

* Garantizar la seguridad de los estudiantes mediante control de asistencia con QR y seguimiento GPS en tiempo real.

* Verificar la identidad y documentación de los conductores mediante OCR y simulación de validación con la ATTT.

* Automatizar la gestión de pagos mensuales entre padres y conductores a través de Stripe.

* Facilitar la comunicación entre padres y conductores mediante notificaciones push en tiempo real.

* Permitir al administrador gestionar usuarios, escuelas, bloqueos e ingresos del sistema desde el panel web.

* Conectar a padres y conductores en un marketplace filtrado automáticamente por escuela y zona geográfica.

# **4\. Listado de módulos**

| Código | Módulo | Descripción |
| :---- | :---- | :---- |
| Módulo 1 | Acceso a la Aplicación | Descarga, selección de rol, inicio de sesión, cierre de sesión y recuperación de contraseña. |
| Módulo 2 | Registro de Conductor | Datos personales, OCR de cédula y licencia (validación ATTT E1/E2/E3), datos del vehículo y simulación de verificación ATTT. |
| Módulo 3 | Registro de Padre de Familia | Registro de datos personales. |
| Módulo 4 | Registro de Hijos | El padre registra a sus hijos con nombre y escuela. Se genera un QR único e irrepetible por cada hijo. |
| Módulo 5 | Marketplace de Conductores | El padre registra su ubicación y busca conductores por ruta o escuela. El conductor al registrar la ruta, su perfil queda público y visible. |
| Módulo 6 | Solicitud y Aceptación de Servicio | Envío de solicitud, aceptación o rechazo por el conductor, registro de información bancaria del padre y activación del cobro automático. |
| Módulo 7 | Gestión de Pagos | Cobro automático mensual vía Stripe, historial de pagos y cobros, notificaciones y descarga de reportes en PDF o Excel. |
| Módulo 8 | Notificaciones del Conductor | El conductor envía mensajes masivos o predefinidos a todos sus padres vinculados mediante Firebase Cloud Messaging. |
| Módulo 9 | Control de Asistencia QR (Subida) | Escaneo QR al abordar el bus o asistencia mediante la lista generada de los estudiantes, registro de asistencia en tiempo real y notificación push al padre. |
| Módulo 10 | Inicio y Seguimiento de Ruta en Vivo | El conductor inicia la ruta activando el GPS. Los padres visualizan el recorrido en tiempo real mediante Socket.io. |
| Módulo 11 | Control de Asistencia QR (Llegada) | Escaneo QR al bajar del bus en el destino, registro de entrega y notificación push al padre. |
| Módulo 12 | Gestión de Perfil | Edición de datos personales, actualización de ruta y escuelas del conductor, y edición de datos de hijos del padre. |
| Módulo 13 | Sitio Web y Panel Administrador | Landing page, inicio de sesión web para todos los roles, y panel exclusivo del administrador para gestión de escuelas, usuarios, bloqueos e ingresos. |
| Módulo 14 | Calificaciones y Reseñas | El padre califica al conductor con estrellas y comentarios. El sistema actualiza el promedio visible en el marketplace. |

# **5\. Lista de Requisitos Funcionales**

| Código | Nombre del Requisito | Módulo | Prioridad | ¿En diagrama? |
| :---- | :---- | :---- | :---- | :---- |
| RF-01 | Descarga de la aplicación | Módulo 1 — Acceso a la Aplicación | Alta | Sí |
| RF-02 | Pantalla de bienvenida y selección de rol | Módulo 1 — Acceso a la Aplicación | Alta | Sí |
| RF-03 | Inicio de sesión: Conductor | Módulo 1 — Acceso a la Aplicación | Alta | Sí |
| RF-04 | Inicio de sesión: Padre | Módulo 1 — Acceso a la Aplicación | Alta | Sí |
| RF-05 | Cierre de sesión | Módulo 1 — Acceso a la Aplicación | Alta | Sí |
| RF-06 | Recuperación de contraseña | Módulo 1 — Acceso a la Aplicación | Media | No |
| RF-07 | Ingreso de datos personales del conductor | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-08 | Validación de cédula del conductor con OCR | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-09 | Validación de licencia con OCR y letra ATTT | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-10 | Ingreso de datos básicos del vehículo | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-11 | Simulación de verificación ATTT | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-12 | Registro de ruta y escuelas del conductor | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-13 | Registro de método de pago del conductor | Módulo 2 — Registro de Conductor | Alta | Sí |
| RF-14 | Ingreso de datos personales del padre | Módulo 3 — Registro de Padre de Familia | Alta | Sí |
| RF-15 | Registro de hijos del padre | Módulo 4 — Registro de Hijos | Alta | Sí |
| RF-16 | Generación de QR único por hijo | Módulo 4 — Registro de Hijos | Alta | Sí |
| RF-17 | Visualización y descarga del QR del hijo | Módulo 4 — Registro de Hijos | Media | Sí |
| RF-18 | Regeneración de QR comprometido | Módulo 4 — Registro de Hijos | Baja | No |
| RF-19 | Registro de ubicación y preferencias del padre | Módulo 5 — Marketplace de Conductores | Alta | Sí |
| RF-20 | Visualización del listado de conductores | Módulo 5 — Marketplace de Conductores | Media | Sí |
| RF-21 | Filtro de conductores por ruta o escuela | Módulo 5 — Marketplace de Conductores | Media | Sí |
| RF-22 | Ver perfil completo del conductor | Módulo 5 — Marketplace de Conductores | Media | No |
| RF-23 | Publicación del perfil del conductor | Módulo 5 — Marketplace de Conductores | Alta | Sí |
| RF-24 | Contacto vía WhatsApp con el conductor | Módulo 5 — Marketplace de Conductores | Alta | Sí |
| RF-25 | Envío de solicitud al conductor | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-26 | Notificación de nueva solicitud al conductor | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-27 | Aceptación de solicitud y fijación de tarifa | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-28 | Rechazo de solicitud | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-29 | Registro de información bancaria del padre | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-30 | Activación de cobro automático mensual | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-31 | Notificación de resultado al padre | Módulo 6 — Solicitud y Aceptación de Servicio | Alta | Sí |
| RF-32 | Cobro mensual automático vía Stripe | Módulo 7 — Gestión de Pagos | Alta | Sí |
| RF-33 | Desglose del cobro mensual | Módulo 7 — Gestión de Pagos | Baja | Sí |
| RF-34 | Notificación de pago exitoso al padre | Módulo 7 — Gestión de Pagos | Alta | No |
| RF-35 | Notificación de pago fallido al padre | Módulo 7 — Gestión de Pagos | Media | No |
| RF-36 | Notificación de cobro al conductor | Módulo 7 — Gestión de Pagos | Media | No |
| RF-37 | Historial de pagos del padre | Módulo 7 — Gestión de Pagos | Media | Sí |
| RF-38 | Historial de cobros del conductor | Módulo 7 — Gestión de Pagos | Media | Sí |
| RF-39 | Descarga de historial en PDF o Excel | Módulo 7 — Gestión de Pagos | Baja | No |
| RF-40 | Redacción y envío de notificación personalizada | Módulo 8 — Notificaciones del Conductor | Media | No |
| RF-41 | Selección de mensaje predefinido | Módulo 8 — Notificaciones del Conductor | Media | Sí |
| RF-42 | Recepción de notificación por el padre | Módulo 8 — Notificaciones del Conductor | Media | Sí |
| RF-43 | Activación del lector QR por el conductor | Módulo 9 — Control de Asistencia QR (Subida) | Alta | Sí |
| RF-44 | Registro de asistencia al subir al bus | Módulo 9 — Control de Asistencia QR (Subida) | Alta | Sí |
| RF-45 | Notificación al padre de subida al bus | Módulo 9 — Control de Asistencia QR (Subida) | Alta | Sí |
| RF-46 | Visualización de lista de asistencia en tiempo real | Módulo 9 — Control de Asistencia QR (Subida) | Alta | Sí |
| RF-47 | Inicio de ruta por el conductor | Módulo 10 — Inicio y Seguimiento de Ruta en Vivo | Alta | Sí |
| RF-48 | Activación de transmisión GPS en tiempo real | Módulo 10 — Inicio y Seguimiento de Ruta en Vivo | Alta | Sí |
| RF-49 | Visualización del mapa en tiempo real por el padre | Módulo 10 — Inicio y Seguimiento de Ruta en Vivo | Alta | Sí |
| RF-50 | Finalización de ruta por el conductor | Módulo 10 — Inicio y Seguimiento de Ruta en Vivo | Alta | Sí |
| RF-51 | Registro de entrega del estudiante al destino | Módulo 11 — Control de Asistencia QR (Llegada) | Media | Sí |
| RF-52 | Notificación al padre de llegada al destino | Módulo 11 — Control de Asistencia QR (Llegada) | Media | Sí |
| RF-53 | Visualización y edición de perfil del conductor | Módulo 12 — Gestión de Perfil | Baja | No |
| RF-54 | Actualización de ruta y escuelas del conductor | Módulo 12 — Gestión de Perfil | Baja | No |
| RF-55 | Visualización y edición de perfil del padre | Módulo 12 — Gestión de Perfil | Baja | No |
| RF-56 | Edición de información de hijos | Módulo 12 — Gestión de Perfil | Baja | No |
| RF-57 | Landing page informativa | Módulo 13 — Sitio Web y Panel Administrador | Baja | Sí |
| RF-58 | Inicio de sesión en el panel web | Módulo 13 — Sitio Web y Panel Administrador | Alta | Sí |
| RF-59 | Gestión de escuelas por el administrador | Módulo 13 — Sitio Web y Panel Administrador | Alta | Sí |
| RF-60 | Visualización de usuarios del sistema | Módulo 13 — Sitio Web y Panel Administrador | Alta | Sí |
| RF-61 | Bloqueo de usuarios por el administrador | Módulo 13 — Sitio Web y Panel Administrador | Alta | Sí |
| RF-62 | Visualización de ingresos y generación de reportes | Módulo 13 — Sitio Web y Panel Administrador | Alta | Sí |
| RF-63 | Historial de pagos desde el navegador | Módulo 13 — Sitio Web y Panel Administrador | Media | Sí |
| RF-64 | Calificación y reseña del conductor por el padre | Módulo 14 — Calificaciones y Reseñas | Baja | No |
| RF-65 | Visualización de reseñas por el conductor | Módulo 14 — Calificaciones y Reseñas | Baja | No |
| RF-66 | Cálculo automático de promedio de calificación | Módulo 14 — Calificaciones y Reseñas | Baja | No |

