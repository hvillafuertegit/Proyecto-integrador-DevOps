# Estrategia de release — IT Incident Hub

## Entornos

- **Desarrollo:** React con Vite, Node.js/Express y PostgreSQL instalados localmente en Windows 11.
- **Validación:** GitHub Actions comprueba sintaxis, pruebas y build de React. GitLab CI/CD ejecuta validación, pruebas, auditoría de dependencias, build y empaquetado.
- **Agente autohospedado:** GitLab Runner con ejecutor Shell en Windows, job `self-hosted-check`.
- **Entrega:** artefactos del job `source-package` y compilación `frontend-build` del pipeline aprobado. No se declara un despliegue público.

## Flujo de aprobación

1. Crear Issue y rama `feature/*`, `fix/*` o `refactor/*`.
2. Realizar y verificar el cambio localmente.
3. Crear Pull Request contra `main`.
4. Comprobar GitHub Actions exitoso y revisión de `heinzvv`.
5. Fusionar el Pull Request y sincronizar `main` con GitLab.
6. Comprobar que el pipeline de GitLab y sus artefactos terminen correctamente.
7. Publicar la versión aprobada.

## Versionado

Se utilizará Semantic Versioning: `v0.1.0` (base inicial), `v0.2.0` (mejoras funcionales y pruebas), `v1.0.0` (entrega final validada). Las etiquetas se crearán únicamente cuando se elija el commit correspondiente; no representan fechas retroactivas.

## Validación previa a v1.0.0

- [ ] Al menos seis Pull Requests aprobados y fusionados, vinculados a cambios reales.
- [ ] Comprobaciones de GitHub Actions y GitLab CI/CD exitosas en el commit de entrega.
- [ ] Registro de análisis de dependencias y decisiones de seguridad.
- [ ] Dos deudas técnicas corregidas con evidencia de PR.
- [ ] Prueba manual del registro, consulta, filtros, asignación y seguimiento de incidentes.
- [ ] Artefactos descargados y conservados.
- [ ] Versiones y release publicados con enlace a evidencia.

## Incidente de pipeline

GitLab registró el pipeline `#3001396760` como `yaml invalid` con cero jobs. Posteriormente, la validación de configuración fue exitosa y el pipeline `#3001416523` completó los cinco jobs; también se verificó el job autohospedado de `#3001475685`.

No se ha identificado una modificación concreta de YAML que causara la recuperación; por ello, estas ejecuciones muestran fallo y recuperación, pero no prueban por sí solas una corrección de código del pipeline. No atribuir una causa sin evidencia.
