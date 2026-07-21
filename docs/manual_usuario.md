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

### 3. Cerebro Estratégico (Consultoría Inversora)
Panel de inteligencia de negocio avanzado que actúa como tu consultor financiero personal:
- **Análisis de Estado**: Tarjetas de diagnóstico que evalúan el margen de beneficio, el colchón fiscal (Safe Monthly Withdrawal) y el Break-Even diario (ventas necesarias por día para cubrir gastos).
- **Simulador de Rentabilidad**: Ajuste interactivo de variables (gastos fijos, ticket medio, sueldo objetivo) para proyectar diferentes escenarios y recibir consejos estratégicos.

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
Gestión documental estructurada y optimizada para la declaración de impuestos:
- **Organización por Modelos**: Los documentos se clasifican automáticamente en carpetas lógicas correspondientes a los modelos trimestrales (Modelo 303 de IVA, Modelos 111 y 115 de retenciones), evitando duplicidades.
- **Auditoría Trimestral**: Revisa el estado de la documentación subida en el trimestre/mes seleccionado, permitiendo adjuntar justificantes o generar borradores PDF y archivos XML LROE (Batuz).
- **Auditoría de Cierre Anual**: Bloque específico en la parte inferior para la campaña de enero:
  - Generación de resúmenes informativos (390, 190, 180).
  - LROE Anual Completo.
  - Verificación de la variación de stock (Inventario Inicial vs Final).

### 7. Datos Fiscales
Panel de configuración donde defines la identidad fiscal (Nombre, NIF, Dirección Fiscal) y los regímenes tributarios (como la estimación directa y variables de COGS / IVA).
