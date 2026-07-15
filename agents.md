# Reglas Generales de Desarrollo y Colaboración (agents.md)

Este documento define las directrices **obligatorias** para cualquier desarrollador o agente de IA que trabaje en el proyecto **NaturaFinance** (Software Contable). Su cumplimiento garantiza un repositorio limpio, un historial comprensible y una documentación siempre actualizada.

---

## 1. Flujo de Trabajo y Buenas Prácticas en Git/GitHub

Para mantener un repositorio limpio y un historial de cambios comprensible:

### Estrategia de Ramas

| Rama | Propósito | Quién escribe |
|------|-----------|---------------|
| `main` | Producción. Código estable y listo para uso real. | Solo mediante PR aprobado desde `dev`. |
| `dev` | Integración. Todas las features completadas aterrizan aquí. | Solo mediante PR desde `feature/*` o `fix/*`. |
| `feature/*` | Nueva funcionalidad (ej. `feature/modulo-calendario`). Se crea desde `dev`. | Agente / desarrollador asignado. |
| `fix/*` | Corrección de bug (ej. `fix/calculo-iva-gastos`). Se crea desde `dev`. | Agente / desarrollador asignado. |

> **REGLA ABSOLUTA**: Nunca se trabaja directamente sobre `main`. Nunca. Ni agentes ni personas.  
> Cada nueva funcionalidad → rama `feature/*`. Cada corrección → rama `fix/*`. Sin excepciones.

### Formato de Commits (Conventional Commits)

Los mensajes de commit deben ser claros, **en español** y seguir el estándar Conventional Commits:

- `feat: ...` → Nueva funcionalidad (ej. `feat: agregar endpoint para subir justificantes`)
- `fix: ...` → Corrección de error (ej. `fix: corregir redondeo de rendimiento neto`)
- `docs: ...` → Solo documentación (ej. `docs: actualizar manual de usuario v1.0`)
- `style: ...` → Cambios estéticos sin lógica (ej. `style: cambiar bordes de tarjetas KPI`)
- `refactor: ...` → Reestructuración sin cambio funcional (ej. `refactor: modularizar pestañas del dashboard`)
- `chore: ...` → Mantenimiento, dependencias (ej. `chore: agregar dependencias en package.json`)

---

## 2. Estándares de Código y Diseño

### Backend (Python + FastAPI)
1. **Guía de Estilo**: Seguir la convención estándar **PEP 8** para legibilidad de Python.
2. **Tipado**: Usar *Type Hints* en todas las funciones y endpoints.
3. **Modelado**: Usar **SQLModel** para definir clases de base de datos (unifica SQLAlchemy y Pydantic).
4. **Respuestas de API**: Todos los endpoints retornan esquemas Pydantic bien definidos con códigos HTTP correctos (200, 201, 404, etc.).

### Frontend (React + Tailwind CSS)
1. **Arquitectura Modular**: Dividir la interfaz en componentes reutilizables dentro de `frontend/src/components/`. No escribir todo en un único archivo.
2. **Estilo Dinámico**: Tailwind CSS para todas las clases. Sin estilos CSS en línea ad-hoc.
3. **Control de Estado**: Usar `useState`, `useMemo`, `useEffect` eficientemente para evitar renders innecesarios.
4. **Responsividad**: Diseño *Mobile-First*, usable en ordenadores, tablets y móviles.

### Base de Datos (SQLite)
1. **Migraciones**: Los cambios estructurales se manejan mediante código ordenado y registrado.
2. **Integridad**: Mantener Foreign Keys bien definidas.

---

## 3. Protocolo de Colaboración de Agentes de IA

Cuando un agente de IA trabaje en este código, debe seguir estas reglas estrictas:

- **Preservación**: No eliminar comentarios, documentación interna o código preexistente sin autorización explícita o justificación técnica documentada.
- **Validación Automática**: Antes de dar una tarea por terminada, verificar que el código compila/ejecuta correctamente y que los servidores de desarrollo corren sin errores.
- **Actualización del Historial**: Mantener actualizados los archivos `task.md` y `walkthrough.md` para reflejar con precisión el trabajo pendiente y el completado.

### Arranque Automático al Inicio de Sesión

**Al comenzar cualquier sesión de trabajo o cuando el usuario solicite un cambio**, el agente deberá arrancar automáticamente ambos servidores de desarrollo para permitir la previsualización en tiempo real de la aplicación:

```powershell
# Terminal 1 — Backend (FastAPI)
cd backend
.venv/Scripts/python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Terminal 2 — Frontend (Vite + React)
cd frontend
npm run dev
```

- **Frontend disponible en**: `http://localhost:5174` (y en red local: `http://<IP_LOCAL>:5174`)
- **API + Swagger disponible en**: `http://localhost:8001/docs`

El agente debe confirmar que ambos servidores responden correctamente antes de proceder con cualquier cambio.

---

## 4. Protocolo de Cierre de Sesión y Limpieza de Git/GitHub

Para garantizar la estabilidad y orden del repositorio al final de cada sesión de desarrollo:

### 4.1. Limpieza Obligatoria al Finalizar la Sesión
- **Consolidar Cambios**: Todo el trabajo en progreso debe estar commiteado en la rama correspondiente (`feature/*` o `fix/*`). Nunca dejar cambios en estado sucio.
- **Ramas Limpias**: Confirmar que no queden ramas locales temporales o de prueba huérfanas sin publicar ni documentar.
- **Commits Descriptivos**: Prohibido cerrar sesión con commits vagos. Cada commit al cerrar debe describir su propósito real.

### 4.2. Prohibición Absoluta de Acciones Destructivas
- No hacer push forzados sobre `main` o `dev`.
- No hacer reset hard en ramas compartidas.

### 4.3. Buenas Prácticas de Sincronización
- **Pull Requests obligatorios**: Toda integración de features o correcciones se realiza a través de Pull Requests hacia `dev`.

### 4.4. Archivos Prohibidos en el Repositorio
- Bases de datos locales (`database.db`).
- Entornos virtuales (`.venv/`).
- Carpetas de construcción y dependencias (`node_modules/`, `dist/`).
- Variables de entorno locales y logs.

---

## 5. Protocolo de Documentación

La documentación es obligatoria y debe mantenerse **siempre actualizada**.

### 5.1. Actualización Obligatoria al Cierre de Sesión
Al finalizar cada sesión, actualizar:
- `CHANGELOG.md` en la raíz del proyecto.
- `docs/manual_usuario.md` con las secciones afectadas.

### 5.2. CHANGELOG — Formato Obligatorio
Formato **Keep a Changelog** (https://keepachangelog.com/es).

### 5.3. Commit de Documentación al Cerrar
El último commit de cada sesión debe ser de tipo `docs:`:
```
docs: actualizar CHANGELOG y walkthrough — sesión AAAA-MM-DD
```
