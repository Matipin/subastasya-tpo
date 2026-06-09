# Reglas Críticas para la Asistencia de IA en SubastasYa

Este documento contiene reglas estrictas establecidas por el usuario que todo agente de IA debe leer y obedecer en cualquier chat o sesión futura.

## 1. RESTRICCIÓN ESTRICTA DE ENDPOINTS (¡MUY IMPORTANTE!)
- **NO SE PERMITE CREAR NUEVOS ENDPOINTS REST** (`@GetMapping`, `@PostMapping`, `@PutMapping`, `@DeleteMapping`, etc.) bajo ninguna circunstancia.
- Los únicos endpoints permitidos en la aplicación son los que ya están definidos en el archivo provisto por el profesor: `info-de-mas/SubastasYa - Endpoints (cambios sugeridos).docx`.
- Si se requiere enviar o recibir nueva información al/del frontend debido a cambios en la base de datos, **sólo se pueden agregar campos adicionales a los DTOs o a las entidades existentes** que devuelven los endpoints actuales. NUNCA crear un endpoint nuevo para ese propósito.

## 2. REGLA DE BASE DE DATOS (`EstructuraActual.sql`)
- El esquema de base de datos dictado en `info-de-mas/EstructuraActual.sql` **se tiene que cumplir a raja tabla**.
- **Excepción / Flexibilidad:** Sí está permitido crear nuevas tablas auxiliares (por ejemplo, para relacionar autenticación de Spring Security o medios de pago si no están definidos) o agregar más campos a las tablas o entidades de Java si el frontend los necesita (como el campo `nombre` o `fechaInicio` en las subastas), siempre y cuando la estructura principal que pide el profesor se respete.
- Todo el código debe reestructurarse para amoldarse a este SQL sin romper el frontend y sin crear nuevos endpoints.

---
*Nota para la IA: Cuando leas este archivo al comienzo de una sesión, asume de inmediato las restricciones indicadas arriba para proponer tus soluciones técnicas.*
