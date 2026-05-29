# 🏃‍♂️ Planificación Ágil y Backlog (SDLC - Fase 3)

Este documento contiene la planificación del desarrollo dividida en **Sprints de 3 días** y las **Historias de Usuario** con sus criterios de aceptación para el desarrollo del MVP.

## ⚙️ Configuración del Entorno de Desarrollo Inicial
Para ejecutar la **Opción A**, se trabajará localmente y en producción utilizando un usuario semilla (Seed User). 
* Se creará un usuario manualmente en el panel de Supabase Auth.
* Su `UUID` se almacenará en el archivo local `.env` como `REACT_APP_USER_ID`.
* Los componentes de React absorberán este ID para interactuar con la base de datos, garantizando una migración transparente a Login Real en la siguiente fase.

---

## 📅 Cronograma de Sprints (Ciclos de 3 Días)

```text
[Sprint 1: Cimientos] ──> [Sprint 2: El Dashboard] ──> [Sprint 3: El Formulario] ──> [Sprint 4: Alertas y Despliegue]
   (Días 1 a 3)              (Días 4 a 6)                (Días 7 a 9)                 (Días 10 a 12)



# 📋 Historias de Usuario Detalladas (Backlog del MVP)

Este documento contiene el desglose de los requerimientos funcionales del MVP de FinanzasApp, estructurados bajo el formato ágil. Cada historia cuenta con sus **Criterios de Aceptación**, los cuales definen las condiciones técnicas y de diseño que deben cumplirse para dar la tarea por terminada (Definition of Done).

---

## 🗂️ ÉPICA 1: MODELO DE DATOS E INICIALIZACIÓN

### HU-01: Inicialización de Categorías en Base de Datos
**Como** Desarrollador del proyecto,  
**Quiero** que la base de datos tenga cargadas mis categorías de vida predefinidas,  
**Para** poder asociar las transacciones correctamente desde el inicio del desarrollo.

* **Criterios de Aceptación:**
    * [ ] La tabla `categorias_presupuesto` en PostgreSQL debe tener registrados exactamente los siguientes 10 nombres asociados al `usuario_id` semilla: *Comida, Gimnasio, Transporte, Salidas, Novia, Hobbies, Ropa, Higiene, Restaurantes, Estética*.
    * [ ] Cada categoría debe permitir inicializarse con un `limite_mensual` base (numérico con dos decimales, ej: `500000.00`) para poder evaluar las alertas de gasto.
    * [ ] Se debe verificar desde la consola de Supabase que los registros se crearon correctamente usando el script SQL de la Fase 2.

---

## 🖥️ ÉPICA 2: INTERFAZ DE USUARIO (UI/UX)

### HU-02: Dashboard de Visualización Financiera (Móvil/Escritorio)
**Como** Usuario único de la aplicación,  
**Quiero** ver una pantalla principal con tarjetas que resuman mi dinero y un listado de movimientos recientes,  
**Para** entender de un solo vistazo el estado de mis finanzas actuales.

* **Criterios de Aceptación:**
    * [ ] **Diseño Responsivo (Mobile-First):** En dispositivos móviles las tarjetas de resumen deben apilarse verticalmente para facilitar la lectura; en pantallas de escritorio deben distribuirse en una cuadrícula (grid) horizontal.
    * [ ] **Tarjetas de Estado Requeridas:** El dashboard debe renderizar obligatoriamente 4 bloques de información:
        1. *Ingresos Totales (Salario)*
        2. *Gasto Mensual Acumulado*
        3. *Gasto Semanal Acumulado*
        4. *Dinero Restante (Caja Real)*
    * [ ] **Módulo de Transacciones Recientes:** Se debe mostrar una lista cronológica con los últimos 5 movimientos guardados en la base de datos.
    * [ ] **Trazabilidad:** Cada elemento de la lista de transacciones debe mostrar de forma clara: Descripción corta, Monto formateado en Pesos Colombianos (COP), Categoría asociada y el método de pago utilizado.

---

## ⚡ ÉPICA 3: FRICCIÓN CERO (REGISTRO EXPRESS)

### HU-03: Botón de Acción Rápida y Formulario Modal Express
**Como** Usuario en la calle,  
**Quiero** registrar un gasto de forma inmediata mediante un formulario flotante simple,  
**Para** evitar que los gastos hormiga se queden sin registrar por pereza o falta de tiempo.

* **Criterios de Aceptación:**
    * [ ] **Accesibilidad:** La interfaz debe presentar un botón de acción flotante (Floating Action Button) destacado visualmente y ubicado en la parte inferior de la pantalla, al alcance del pulgar en dispositivos móviles.
    * [ ] **Comportamiento del Modal:** Al presionar el botón, se debe desplegar una ventana modal superpuesta sobre el dashboard, bloqueando el fondo, sin recargar la página.
    * [ ] **Campos Obligatorios del Formulario:** El formulario debe validar que los siguientes campos no estén vacíos antes de enviar:
        * `Monto`: Input numérico (sin permitir caracteres de texto).
        * `Descripción`: Input de texto libre corto (ej: "Café espresso con pan").
        * `Categoría`: Menú desplegable (Dropdown) poblado dinámicamente con las 10 categorías de la HU-01.
        * `Método de Pago`: Menú desplegable con las opciones fijas: *Nequi, Tarjeta Crédito, Tarjeta Débito, Efectivo*.
    * [ ] **Inyección de Datos:** Al dar clic en "Guardar Gasto", el cliente de Supabase debe realizar la inserción directamente en la tabla `transacciones` usando el `usuario_id` del entorno local.
    * [ ] **Cierre y Éxito:** Una vez guardado el registro con éxito, el modal debe cerrarse automáticamente y las tarjetas del Dashboard deben actualizar sus valores de forma reactiva en milisegundos.

---

## 📈 ÉPICA 4: INTELIGENCIA FINANCIERA Y DESPLIEGUE

### HU-04: Lógica de Semáforo de Presupuestos y Despliegue a Producción
**Como** Usuario de la aplicación,  
**Quiero** que el sistema me alerte visualmente cuando me estoy gastando el cupo de una categoría,  
**Para** frenar el gasto hormiga antes de que sea tarde.

* **Criterios de Aceptación:**
    * [ ] **Lógica del Semáforo Financiero:** El componente del presupuesto por categoría debe calcular el porcentaje consumido (`(Suma de Gastos / Límite Mensual) * 100`) y cambiar las clases de Tailwind CSS según las siguientes reglas:
        * 🟢 **Verde:** Consumo menor al 70% del límite fijado.
        * 🟡 **Amarillo:** Consumo entre el 70% y el 99.9% (Alerta visual de proximidad).
        * 🔴 **Rojo:** Consumo igual o superior al 100% (Indicador de presupuesto excedido).
    * [ ] **Seguridad del Entorno:** Las credenciales de Supabase (`URL` y `ANON_KEY`) deben consumirse estrictamente a través de variables de entorno (`.env` local y variables de producción en Vercel). No debe existir ninguna credencial expuesta en el código público de GitHub.
    * [ ] **Despliegue Exitoso:** La aplicación debe estar compilada y corriendo en producción de forma pública en Vercel, enlazada a la rama principal del repositorio, ejecutando despliegues automáticos (Continuous Deployment) con cada `git push`.