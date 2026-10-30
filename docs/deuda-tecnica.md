# Deuda técnica — IT Incident Hub

Se identificaron cinco situaciones en el código del proyecto. Las correcciones marcadas como resueltas cuentan con Pull Requests fusionados.

| ID | Situación identificada | Estado | Evidencia |
|---|---|---|---|
| DT-01 | La pantalla principal concentraba múltiples vistas React | Parcialmente resuelta | PR #32: separación de Sidebar, DashboardPage e IncidentsPage; aún quedan vistas en main.jsx |
| DT-02 | Los filtros se aplicaban a la lista de incidentes ya cargada en memoria | Resuelta | Issue #24, PR #37: consultas filtradas a la API REST desde React |
| DT-03 | El listado de incidentes no tiene paginación | Pendiente | Límite de 200 registros en la consulta actual |
| DT-04 | Faltan pruebas de integración completas con PostgreSQL | Pendiente | Pruebas unitarias y de API existentes; faltan pruebas de integración real de base de datos |
| DT-05 | Escrituras de incidentes y bitácora sin transacción conjunta | Resuelta | Issue #35, PR #36: transacciones de PostgreSQL con rollback |

## Correcciones verificables

- DT-02: https://github.com/hvillafuertegit/Proyecto-integrador-DevOps/pull/37
- DT-05: https://github.com/hvillafuertegit/Proyecto-integrador-DevOps/pull/36
- Refactorización parcial DT-01: https://github.com/hvillafuertegit/Proyecto-integrador-DevOps/pull/32

Las deudas pendientes quedan registradas para futuras iteraciones. No se consideran completadas.
