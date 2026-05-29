# 💰 FinanzasApp - MVP de Control de Gastos Hormiga

## 1. CONCEPTO Y DESCUBRIMIENTO (SDLC - Fase 1)

### 🚨 El Problema
El usuario presenta una fuga constante de dinero debido a "gastos hormiga" no identificados. Existe una falta de trazabilidad centralizada, ya que los fondos se dispersan a través de múltiples canales financieros: Tarjeta de Crédito, Tarjeta de Débito, Efectivo y, principalmente, billeteras digitales (Nequi). No existen presupuestos definidos por áreas de vida, lo que impide un control general del patrimonio.

### 🎯 El Objetivo del MVP
Desarrollar una aplicación web centralizada, de uso personal y con diseño responsive (fricción cero desde el celular), que permita registrar transacciones financieras al instante, clasificándolas por método de pago y categoría, para ofrecer un balance visual en tiempo real frente a un presupuesto límite establecido.

### 👥 Perfil de Usuario (User Persona)
* **Usuario único:** Desarrollador/Analista técnico que necesita registrar gastos en movilidad (la calle) y analizar métricas consolidadas en pantallas de escritorio.

---

## 🛠️ ALCANCE DEL MVP (Scope)

Para garantizar un despliegue rápido y eficiente, el software se limitará estrictamente a las siguientes características core:

### 1. Dashboard Principal (UI/UX Adaptable)
* **Tarjetas de Estado Resumen:** * Ingresos Totales (Salario).
    * Gasto Mensual Acumulado.
    * Gasto Semanal Acumulado.
    * Dinero Restante (Caja Real).
* **Módulo de Transacciones Recientes:** Lista cronológica de los últimos movimientos registrados.
* **Botón de Acción Rápida:** Botón flotante accesible desde el celular para abrir el formulario de registro express sin salir de la pantalla principal.

### 2. Formulario de Registro Express (Fricción Cero)
* **Campos requeridos:**
    * `Monto` (Numérico).
    * `Descripción` (Texto corto, ej: "Café con pan").
    * `Categoría` (Selector: Comida, Transporte, Entretenimiento, Servicios, Otros).
    * `Método de Pago` (Selector: Nequi, Tarjeta de Crédito, Tarjeta de Débito, Efectivo).

### 3. Sistema de Presupuestos y Alertas
* Establecimiento de un tope de gasto mensual por categoría.
* **Indicadores Visuales (Semáforo):** Las tarjetas y barras de progreso cambiarán de estado según el consumo:
    * 🟢 **Verde:** Menor al 70% del presupuesto.
    * 🟡 **Amarillo:** Entre el 70% y el 99% (Alerta de proximidad).
    * 🔴 **Rojo:** 100% o más (Presupuesto excedido).
### 4. Reportes mensuales y anuales
* Un modulo de resportes que permitan visualizar los gastos mensuales y anuales que se han ido haciendo durante el uso de la app.

### 📈 Criterios de Éxito del MVP
* **Fricción de Registro:** El tiempo total para registrar un gasto desde el celular no debe superar los 5 segundos (desde que se abre la app hasta que se guarda).
* **Consistencia de Datos:** El balance del "Dinero Restante" en el Dashboard debe cuadrar al 100% con los saldos reales reportados por el usuario de forma manual.
* **Adopción:** Lograr el registro diario ininterrumpido durante los primeros 30 días post-despliegue.

### 🚫 Fuera de Alcance (Out of Scope - Lo que NO hará el MVP)
* **Sincronización Automática Bancaria/Nequi:** No se realizarán conexiones mediante APIs o Web Scraping a bancos ni a Nequi para extraer transacciones automáticamente. Todo el registro en esta fase es 100% manual.
* **Múltiples Monedas:** El sistema operará única y exclusivamente en Pesos Colombianos (COP).
* **Multi-usuario / Roles:** No habrá gestión de permisos para terceros. Es una base de datos con un único entorno de usuario.

### ⚠️ Riesgos y Mitigación
1. **Riesgo: Olvido de registro en el punto de venta.** 
   * *Mitigación:* La interfaz web responsive debe permitir crear un acceso directo (PWA básica) en la pantalla de inicio del celular para que actúe como una app nativa a un toque de distancia.
2. **Riesgo: Complejidad en la tarjeta de crédito (Múltiples cuotas).**
   * *Mitigación:* Para el MVP, el gasto con tarjeta de crédito se descontará inmediatamente del presupuesto de la categoría correspondiente en el mes en curso, ignorando el diferido de cuotas para mantener la lógica simple.