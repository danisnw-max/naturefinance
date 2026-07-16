# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
