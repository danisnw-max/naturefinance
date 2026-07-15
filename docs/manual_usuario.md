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

### 5. Amortización
Visualiza el valor depreciado anual y mensual de tus inversiones duraderas, calculando el retorno de inversión (ROI) estimado.

### 6. Portal de Gestoría
Gestión documental para cierres trimestrales y anuales:
- **Sincronización Automática**: El sistema obtiene tus ingresos de forma invisible desde la base de datos de la tienda, manteniendo tus números actualizados cada vez que inicias sesión.
- **Subida de Ventas (Opcional)**: Sigue disponible la importación del CSV si prefieres trabajar sin la conexión local directa.
- **Gestor Documental**: Listado inteligente por proveedor que te indica qué justificante PDF te falta subir y permite cargarlos.
- **Generación de lotes**: Descarga de lote ZIP de justificantes y generación de borradores XML/LROE (Modelo 140).

### 7. Datos Fiscales
Panel de configuración donde defines la identidad fiscal (Nombre, NIF, Dirección Fiscal) y los regímenes tributarios (como la estimación directa y variables de COGS / IVA).
