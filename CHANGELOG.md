# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.3.1] - 2026-07-21

### Cambiado
- **Manejo de Devoluciones (Tienda -> Contable)**:
  - Eliminada la creación automática de un registro individual en el Libro de Gastos por cada devolución de venta. 
  - Las devoluciones ahora solo impactan el sistema como tickets con importe negativo, restándose automáticamente del volumen total de ventas al sincronizar los ingresos, consolidando todo el flujo en el Portal de Cierre sin generar gastos redundantes.
  - Eliminados los registros históricos de "Devolución de Ventas" en el Libro de Gastos para limpiar el historial.

---

## [1.3.0] - 2026-07-20### Añadido
- **Envío de Nóminas por Email**:
  - Nuevo enrutador `backend/routers/empleados.py` para consultar la lista de empleados directamente desde la base de datos de la tienda.
  - Nuevo endpoint `POST /api/gastos/{gasto_id}/send-email` que lee la configuración SMTP de la tienda y envía por correo electrónico la nómina en PDF al empleado seleccionado.
  - En la interfaz del Libro de Gastos (`GastosTab.jsx`), añadido botón con icono de correo junto a cada justificante de nómina subido, abriendo un modal dinámico para seleccionar el empleado o personalizar el email.

---

## [1.2.2] - 2026-07-20

### Añadido
- **Filtro por Categoría en el Libro de Gastos**:
  - Añadido selector de categoría (`Alquiler`, `Nóminas y Personal`, `S.S. Autónomo`, etc.) en la barra de filtros de `GastosTab.jsx`.
  - Integrado con la API backend en `App.jsx` para recalcular totales y re-paginar los gastos filtrados dinámicamente.

---

## [1.2.1] - 2026-07-20

### Corregido
- **Cálculo de Ventas Netas con Devoluciones**:
  - Corregida la consulta en `backend/routers/reports.py` y `backend/routers/ventas.py` para incluir todos los tickets de devolución (importes negativos) directamente en la suma de ingresos de NaturaERP.
  - El total de ventas devuelto por la API y mostrado en el *Portal de Cierre* ahora refleja las ventas netas exactas (Ventas brutas menos Devoluciones).
  - Eliminada la duplicación de devoluciones como registros de gasto para evitar una doble reducción del resultado contable.

---

## [1.2.0] - 2026-07-19

### Añadido
- **Integración de Devoluciones desde NaturaERP**:
  - Cuando se procesa una devolución desde la tienda, se registra automáticamente un gasto de tipo `"Devolución de Ventas"` en el Libro de Gastos de Nature Finance.
  - Los registros de devolución quedan excluidos del cálculo de `ingresosTotales` en los reportes fiscales (modelos 130, 303) para evitar doble imputación negativa.
  - Actualizado el endpoint `/api/ventas/sync-tienda` para filtrar documentos de tipo `"Devolución"` en la lectura de ingresos.
  - Actualizado `reports.py` para excluir devoluciones del cálculo de la base imponible y del IVA repercutido.

### Cambiado
- **Modelo de Ventas**: Soporte para el campo `tipo_documento` que distingue entre `"Venta"` y `"Devolución"` al sincronizar con NaturaERP.

---

## [1.1.1] - 2026-07-19

### Añadido
- **Acceso directo a Justificantes**: En el Libro de Gastos, la celda "Justificante" ahora es un enlace interactivo ("Ver Doc") que permite visualizar o descargar directamente el PDF/imagen adjunto del gasto en una nueva pestaña del navegador.
- **Re-subida de justificantes**: Se añadió un control (icono de subida) junto al enlace del documento para permitir re-subir o cambiar el justificante de un gasto existente de forma instantánea.
- **Filtros Temporales en el Libro de Gastos**:
  - Selector de Año (2026, 2025).
  - Selector rápido de Trimestre (T1, T2, T3, T4, Todos).
  - Selector de Mes adaptativo según el trimestre seleccionado.
- **Filtro de Auditoría (⚠️ Sin Justificante)**: Switch interactivo para filtrar la tabla mostrando solo los gastos que no tienen factura física subida.
- **Tarjetas Resumen KPI**:
  - *Total Gastos*: Muestra la suma bruta de gastos del periodo seleccionado.
  - *IVA Soportado Deducible*: Muestra la cuota estimada deducible.
  - *Cobertura Justificantes*: Porcentaje y barra de progreso de facturas subidas en el periodo.
- **Agrupación Mensual en Tabla**: Registros divididos cronológicamente con banners mensuales y subtotales acumulados (gasto bruto e IVA deducible del mes en la página).
- **Gastos Recurrentes / Fijos Mensuales**:
  - Añadido el campo `es_recurrente` en el modelo `Gasto` y migración automática de base de datos en el arranque del servidor.
  - El formulario de alta de gasto ahora incluye la opción para marcar un gasto como recurrente mensual.
  - La tabla del Libro de Gastos resalta visualmente los costos fijos mediante la etiqueta `"Fijo"`.
  - Nuevo botón `"🔄 Autogenerar Fijos"` en la barra de periodos que copia y duplica automáticamente todos los gastos fijos del histórico hacia el mes seleccionado, descartando duplicados para evitar registros redundantes.
  - Actualizado el semillado inicial para poblar automáticamente los gastos fijos de todos los meses de 2026.
## [1.1.0] - 2026-07-16

### Añadido
- **Motor de Exportación Real (`backend/routers/exports.py`)**: Nuevo enrutador FastAPI que reemplaza completamente los botones de alerta de descarga del Portal de Gestoría por ficheros reales generados en servidor.
  - `GET /api/exports/justificantes-zip`: Genera y descarga un archivo `.zip` con todos los justificantes físicos del periodo seleccionado, un resumen de facturación en `.txt` y un listado de tickets de venta en `.csv` consultado directamente de la BBDD de NaturaERP.
  - `GET /api/exports/modelo-303-pdf`: Genera un PDF oficial del borrador del **Modelo 303** (IVA Trimestral) con datos calculados en tiempo real (NIF, titular, bases imponibles, cuotas, resultado de liquidación).
  - `GET /api/exports/modelo-130-pdf`: Genera un PDF oficial del borrador del **Modelo 130** (Pago Fraccionado de IRPF) con rendimiento neto y pago a cuenta trimestral.
  - `GET /api/exports/lroe-xml`: Genera el fichero XML oficial del **Capítulo 2 (Gastos con Factura Recibida)** del **Libro Registro de Operaciones Económicas (LROE) - Modelo 140** de Bizkaia, compatible con el portal [batuz.eus](https://www.batuz.eus).
- **Integración Contable al Recibir Pedidos (NaturaERP)**: Al verificar la llegada de un pedido en el módulo de *Gestión de Pedidos* de la tienda, el modal de recepción ahora incluye un campo obligatorio para adjuntar la **factura del proveedor en PDF**. Al validar el stock, el sistema envía automáticamente:
  - Una nueva entrada al **Libro de Gastos** de NaturaFinance (categoría *Compras y Aprovisionamientos*, con importe calculado a precio de coste real).
  - El archivo PDF de la factura, vinculado al registro del gasto como justificante oficial.
- **Librería fpdf2**: Instalada en el entorno virtual del backend para la generación de PDFs.
- **Librería sqlite3**: Importada en el router de exportaciones para consulta directa de la BBDD de la tienda.

### Cambiado
- **Portal de Gestoría – Botones de Descarga**: Todos los `alert()` de marcador de posición han sido reemplazados por enlaces directos a los nuevos endpoints de la API de exportación, con parámetros de trimestre/año dinámicos.
- **ZIP de Justificantes**: El botón ya no devuelve un 404 cuando no hay PDFs físicos subidos; en su lugar, siempre genera un ZIP con el resumen de actividad del periodo.
- **Cabecera CSV de Ventas**: Cambiada de `ID_Ticket` a `Ticket_ID` para evitar el falso positivo de seguridad del formato SYLK en Microsoft Excel.

### Corregido
- `NameError: name 'TIENDA_DB_PATH' is not defined` en `exports.py` al consultar ventas de la tienda.
- `NameError: name 'sqlite3' is not defined` en `exports.py` al intentar conectar con la BBDD de la tienda.
- `UnicodeEncodeError` por el símbolo de Euro (`€`) y tildes en la generación de PDFs con FPDF2 (fuentes core Latin-1), resuelto sustituyendo `€` por `EUR` y eliminando caracteres fuera del rango ASCII-256.

## [1.0.0] - 2026-07-15

### Añadido
- Inicialización del proyecto contable **NaturaFinance** bajo la misma pila técnica que el software de la tienda.
- Servidor Backend en FastAPI (Puerto 8001) conectado a SQLite mediante SQLModel, con inicialización de semillas de datos.
- Aplicación SPA Frontend en Vite + React + TailwindCSS v4 (Puerto 5174).
- Módulos completos para:
  - **Dashboard**: Métricas clave y liquidación de impuestos.
  - **Libro de Gastos**: Registro de facturas, abonos e inversiones.
  - **Cerebro Estratégico**: Simulación de rentabilidad interactiva.
  - **Calendario Fiscal**: Previsualización de los modelos 303, 130, 111 y 115 de Hacienda Foral de Bizkaia.
  - **Amortizaciones**: Control de vida útil y ROI de inversiones.
  - **Portal de Gestoría**: Gestor documental de justificantes en PDF y carga de CSV de ventas.
  - **Datos Fiscales**: Configuración de existencias (COGS) y porcentajes fiscales.
- Archivo de ejemplo `ventas_ejemplo.csv` para pruebas del importador.
- **Conexión Inter-BBDD**: Conexión nativa de solo lectura desde el backend contable hacia la base de datos de la tienda (`database.db`).
- **Sincronización Automática**: La aplicación consulta y actualiza los ingresos de la tienda automáticamente en cada carga del sistema, prescindiendo del botón manual.
- **Campo Dirección Fiscal**: Incorporación del campo `dirección` en el backend y en la interfaz (Datos Fiscales).

### Cambiado
- **Arquitectura de Reportes**: Centralización de los cálculos fiscales (Modelos 303, 130, 111, 115, etc.) en el backend (FastAPI) para un rendimiento instantáneo (nuevo endpoint `GET /api/reports/fiscal-summary`).
- **Proveedores Unificados**: El listado de proveedores se lee en tiempo real de la base de datos de la tienda en lugar de duplicarse.
- **Rendimiento**: Paginación backend añadida en el `Libro de Gastos` para evitar saturación de cliente con históricos grandes.
- **Interfaz de Justificantes**: Nuevo botón de subida rápida de justificantes en PDF o imagen, línea por línea.
