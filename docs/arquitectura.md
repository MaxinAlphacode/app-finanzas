# 📐 Arquitectura del Sistema y Stack Tecnológico (SDLC - Fase 2)

Este documento detalla la estructura técnica, el flujo de datos, la configuración de infraestructura a costo cero y el modelo de datos relacional para el MVP de la aplicación de finanzas personales.

---

## 1. 🛠️ Stack Tecnológico Seleccionado

Para garantizar la máxima velocidad de desarrollo, fricción cero en el registro móvil y un costo operativo de $0, se ha seleccionado un enfoque desacoplado basado en servicios (BaaS):

* **Frontend (Cliente):** React.js + Tailwind CSS. 
    * *Razón:* Permite construir una Single Page Application (SPA) ultra rápida con diseño *Mobile-First* adaptado a pantallas móviles y de escritorio.
* **Backend como Servicio (BaaS):** Supabase.
    * *Razón:* Elimina la necesidad de programar y mantener un servidor tradicional en Node.js, generando automáticamente una API REST segura basada en la estructura de la base de datos.
* **Base de Datos:** PostgreSQL (Hospedada en la capa gratuita de Supabase).
    * *Razón:* Motor relacional robusto que garantiza consistencia e integridad matemática absoluta para el control del dinero.
* **Alojamiento Frontend:** Vercel (Capa Gratuita).
    * *Razón:* Despliegue continuo e inmediato conectado directamente al repositorio de GitHub.

---

## 2. 🌐 Patrón de Arquitectura y Flujo de Datos

El sistema opera bajo una **Arquitectura Cliente/Servidor Desacoplada**. La lógica de la interfaz (Vista y Controlador) corre en el dispositivo del usuario, mientras que el almacenamiento y la seguridad de los datos (Modelo) residen en la nube de Supabase.



### Flujo de Ejecución de un Gasto Express:
1. El usuario abre la app web desde el celular y presiona el botón flotante de registro rápido.
2. Al diligenciar el formulario y guardar, **React** empaqueta los datos en formato JSON.
3. El cliente de Supabase en el frontend realiza una petición HTTP POST directa a los servidores de **Supabase**.
4. La base de datos valida los permisos mediante políticas de seguridad (**RLS**) e inserta el registro en **PostgreSQL**.
5. La respuesta regresa al cliente en milisegundos, actualizando las tarjetas del Dashboard de manera reactiva.

---

## 3. 📊 Modelo Entidad-Relación (MER)

El diseño de la base de datos se estructura mediante tres tablas core optimizadas para evitar redundancia y garantizar la trazabilidad por métodos de pago y categorías.

### 👥 Tabla: `usuarios` (Manejada por Supabase Auth)
* `id`: `uuid` (Primary Key) -> Generado automáticamente por Supabase.
* `email`: `varchar`.

### 🗂️ Tabla: `categorias_presupuesto`
Contiene los límites mensuales de gasto por cada área.
* `id`: `bigint` (Primary Key - Autoincremental).
* `usuario_id`: `uuid` (Foreign Key -> `usuarios.id` con borrado en cascada).
* `nombre`: `varchar` (Ej: 'Comida', 'Transporte', 'Entretenimiento').
* `limite_mensual`: `decimal(12,2)` -> Almacena el tope de dinero sin errores de redondeo flotante.
* `creado_en`: `timestamp` (Por defecto `now()`).

### 💸 Tabla: `transacciones`
Registra cada movimiento de entrada o salida de dinero.
* `id`: `bigint` (Primary Key - Autoincremental).
* `usuario_id`: `uuid` (Foreign Key -> `usuarios.id`).
* `categoria_id`: `bigint` (Foreign Key -> `categorias_presupuesto.id`).
* `monto`: `decimal(12,2)` -> Valor de la transacción.
* `descripcion`: `varchar(255)` (Ej: 'Café espresso con pan').
* `metodo_pago`: `varchar` (Restringido por check o regla: 'Nequi', 'Tarjeta Crédito', 'Tarjeta Débito', 'Efectivo').
* `tipo`: `varchar` (Check: 'Ingreso', 'Gasto').
* `fecha_transaccion`: `timestamp` (Por defecto `now()`).

---

## 4. 🔒 Seguridad y Reglas de Negocio en la Base de Datos

Para proteger la información sin un backend intermedio, se activará **Row Level Security (RLS)** en PostgreSQL.

* **Aislamiento de Datos:** Ningún usuario puede leer, actualizar o borrar registros que no tengan su propio `usuario_id`.
* **Regla de Negocio del MVP (Tarjetas de Crédito):** Toda transacción registrada con el método de pago 'Tarjeta Crédito' se restará inmediatamente del presupuesto disponible del mes corriente, simplificando la lógica al ignorar el diferido de cuotas.