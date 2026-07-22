-- 🧹 Cleanup Script V2 (Preciso para tu esquema)
-- Este script eliminará TODAS las tablas y secuencias del backend de Java,
-- conservando ÚNICAMENTE tus 5 nuevas tablas del Portfolio (profiles, auctions, items, bids, debts).

-- Eliminar tablas con llaves foráneas primero para evitar errores, con CASCADE
DROP TABLE IF EXISTS public.usuarios CASCADE;
DROP TABLE IF EXISTS public.registrodesubasta CASCADE;
DROP TABLE IF EXISTS public.registro_de_subasta CASCADE;
DROP TABLE IF EXISTS public.pujos CASCADE;
DROP TABLE IF EXISTS public.asistentes CASCADE;
DROP TABLE IF EXISTS public.itemscatalogo CASCADE;
DROP TABLE IF EXISTS public.items_catalogo CASCADE;
DROP TABLE IF EXISTS public.catalogos CASCADE;
DROP TABLE IF EXISTS public.fotos CASCADE;
DROP TABLE IF EXISTS public.productos CASCADE;
DROP TABLE IF EXISTS public.subastas CASCADE;
DROP TABLE IF EXISTS public.subastadores CASCADE;
DROP TABLE IF EXISTS public.duenios CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.seguros CASCADE;
DROP TABLE IF EXISTS public.sectores CASCADE;
DROP TABLE IF EXISTS public.empleados CASCADE;
DROP TABLE IF EXISTS public.personas CASCADE;
DROP TABLE IF EXISTS public.paises CASCADE;
DROP TABLE IF EXISTS public.deudas CASCADE;
DROP TABLE IF EXISTS public.notificaciones CASCADE;
DROP TABLE IF EXISTS public.subastas_detalles CASCADE;
DROP TABLE IF EXISTS public.articulos_propuestos CASCADE;
DROP TABLE IF EXISTS public.medios_de_pago CASCADE;
DROP TABLE IF EXISTS public.mediosdepago CASCADE;

-- Eliminar secuencias de Hibernate (¡que fueron creadas como tablas!)
DROP TABLE IF EXISTS public.asistentes_seq CASCADE;
DROP TABLE IF EXISTS public.catalogos_seq CASCADE;
DROP TABLE IF EXISTS public.fotos_seq CASCADE;
DROP TABLE IF EXISTS public.items_catalogo_seq CASCADE;
DROP TABLE IF EXISTS public.medios_de_pago_seq CASCADE;
DROP TABLE IF EXISTS public.paises_seq CASCADE;
DROP TABLE IF EXISTS public.personas_seq CASCADE;
DROP TABLE IF EXISTS public.productos_seq CASCADE;
DROP TABLE IF EXISTS public.pujos_seq CASCADE;
DROP TABLE IF EXISTS public.registro_de_subasta_seq CASCADE;
DROP TABLE IF EXISTS public.sectores_seq CASCADE;
DROP TABLE IF EXISTS public.subastas_seq CASCADE;
DROP TABLE IF EXISTS public.usuarios_seq CASCADE;

-- ¡Listo! Ahora tu base de datos está totalmente limpia.
