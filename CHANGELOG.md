# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto se adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
