# Manual de Usuario - NaturaFinance

NaturaFinance es el módulo de inteligencia contable y fiscal para Aterpe Herboristería, diseñado para el cumplimiento y previsión de modelos tributarios ante la Hacienda Foral de Bizkaia.

## Acceso
La aplicación está disponible localmente a través de las siguientes direcciones:
- **Aplicación Web**: `http://localhost:5174` (o la IP local expuesta en tu red).
- **API Swagger (Servicios)**: `http://localhost:8001/docs`

## Módulos

### 1. Dashboard
Lectura rápida de KPIs financieros principales:
- **Ingresos Brutos**: Ventas brutas acumuladas.
- **Gastos Totales**: Suma de tus gastos operacionales y simulaciones.
- **Beneficio Neto (Bolsillo)**: Dinero limpio libre de impuestos.

### 2. Libro de Gastos
Registro ordenado de tus operaciones de compra (con paginación automática):
- Permite ingresar facturas estándar y facturas rectificativas/abonos (usando el selector de tipo de documento para restar importes).
- Cuenta con un selector predictivo de proveedores integrado con la base de datos de la tienda.
- Permite adjuntar el PDF o imagen de tu justificante directamente desde la tabla de operaciones, en cada fila.
- Opción de marcar un gasto de gran valor (> 300€) como bien de inversión para amortizarlo linealmente.

### 3. Cerebro Estratégico
Simulador financiero interactivo con sliders que permite evaluar:
- El impacto de añadir costes estructurales extra.
- El ajuste de tus precios de venta sobre el beneficio.
- Tu sueldo objetivo para determinar el excedente libre de la empresa.

### 4. Calendario Fiscal
Cálculo en tiempo real de los modelos oficiales de Bizkaia:
- **Modelo 303**: Liquidación trimestral de IVA.
- **Modelo 130**: Pago fraccionado trimestral del IRPF (20% sobre el rendimiento neto final).
- **Modelo 111**: Retenciones de nóminas (basado en la categoría 'Nóminas y Personal').
- **Modelo 115**: Retenciones de alquiler de local comercial (basado en la categoría 'Alquiler').

> **Gestión Manual de Estados**: Haz clic directamente sobre los iconos de advertencia o check en cualquier tarjeta para alternar manualmente su estado entre *"Pendiente"* y *"Presentado"*. El estado se guardará automáticamente en tu navegador para el trimestre activo.

### 5. Amortización
Visualiza el valor depreciado anual y mensual de tus inversiones duraderas, calculando el retorno de inversión (ROI) estimado.

### 6. Portal de Gestoría
Gestión documental para cierres trimestrales y anuales:
- **Sincronización Automática**: El sistema obtiene tus ingresos de forma invisible desde la base de datos de la tienda, manteniendo tus números actualizados cada vez que inicias sesión.
- **Subida de Ventas (Opcional)**: Sigue disponible la importación del CSV si prefieres trabajar sin la conexión local directa.
- **Gestor Documental**: Listado inteligente por proveedor que te indica qué justificante PDF te falta subir y permite cargarlos.
- **Generación de Lotes Trimestrales**: Descarga de lote ZIP de justificantes, borradores PDF (303, 111, 115) y ficheros XML LROE por trimestre.
- **Cierre Anual Fiscal (Modelos Informativos de Enero)**: Descarga de los resúmenes informativos exigidos por Hacienda Bizkaia:
  - **Modelo 390 (PDF)**: Resumen Anual de IVA (Base imp. ventas, IVA devengado 10%, base/cuota deducible de compras y resultado anual).
  - **Modelo 190 (PDF)**: Resumen Anual de Retenciones de Personal (Nóminas - Clave A, número de perceptores y retención total).
  - **Modelo 180 (PDF)**: Resumen Anual de Retenciones sobre Alquileres de Inmuebles.
  - **LROE Anual Completo (XML)**: Fichero XML con el histórico anual completo de Cap. 1 (Ingresos/Ventas), Cap. 2.1 (Gastos con Factura) y Cap. 2.2 (Gastos sin Factura/Nóminas).

### 7. Datos Fiscales
Panel de configuración donde defines la identidad fiscal (Nombre, NIF, Dirección Fiscal) y los regímenes tributarios (como la estimación directa y variables de COGS / IVA).
