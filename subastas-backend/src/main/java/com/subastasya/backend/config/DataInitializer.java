package com.subastasya.backend.config;

import com.subastasya.backend.model.EstadoRegistro;
import com.subastasya.backend.model.Usuario;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.model.*;
import com.subastasya.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.List;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final SubastaRepository subastaRepository;
    private final ProductoRepository productoRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final DuenioRepository duenioRepository;
    private final FotoRepository fotoRepository;
    private final AsistenteRepository asistenteRepository;
    private final ClienteRepository clienteRepository;
    private final DeudaRepository deudaRepository;
    private final NotificacionRepository notificacionRepository;
    private final PujoRepository pujoRepository;
    private final MedioDePagoRepository medioDePagoRepository;
    private final SeguroRepository seguroRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        // Fix DB state
        try {
            jdbcTemplate.execute("DELETE FROM notificaciones WHERE usuario_id NOT IN (SELECT idusuario FROM usuarios)");
            jdbcTemplate.execute("DELETE FROM mediosdepago WHERE cliente_id NOT IN (SELECT identificador FROM clientes)");
            jdbcTemplate.execute("CREATE TABLE IF NOT EXISTS seguros (nroPoliza VARCHAR(30) PRIMARY KEY, compania VARCHAR(150) NOT NULL, polizaCombinada VARCHAR(2), importe NUMERIC(18,2) NOT NULL)");
        } catch (Exception e) {
            System.err.println("Error cleaning DB: " + e.getMessage());
        }

        // Empleado Admin Revisor
        Empleado admin = empleadoRepository.findAll().stream().filter(e -> "99999999".equals(e.getDocumento())).findFirst().orElseGet(() -> {
            Empleado e = new Empleado();
            e.setDocumento("99999999");
            e.setNombre("Admin Revisor");
            e.setCargo("Revisor y Responsable");
            return empleadoRepository.save(e);
        });

        // 1. Create test user (comun)
        Optional<Usuario> optU1 = usuarioRepository.findByEmail("test@sello.com");
        final Usuario u1;
        if (optU1.isEmpty()) {
            Usuario tempU1 = new Usuario();
            tempU1.setEmail("test@sello.com");
            tempU1.setPassword("123456");
            tempU1.setEstadoRegistro(EstadoRegistro.ACTIVO);
            
            Cliente c1 = new Cliente();
            c1.setNombre("Test Comun");
            c1.setDocumento("12345678");
            c1.setCategoria("comun");
            
            tempU1.setCliente(c1);
            u1 = usuarioRepository.save(tempU1);
        } else {
            u1 = optU1.get();
        }

        if (medioDePagoRepository.findByCliente_Identificador(u1.getCliente().getIdentificador()).isEmpty()) {
            MedioDePago mp = new MedioDePago();
            mp.setCliente(u1.getCliente());
            mp.setTipo("TARJETA");
            mp.setEntidad("VISA");
            mp.setNumero("4509953566233704");
            mp.setTitular("APRO");
            mp.setVerificado(true);
            medioDePagoRepository.save(mp);
        }

        // Create or update ORO user
        Optional<Usuario> optOro = usuarioRepository.findByEmail("oro@sello.com");
        final Usuario uOro;
        if (optOro.isEmpty()) {
            Usuario tempOro = new Usuario();
            tempOro.setEmail("oro@sello.com");
            tempOro.setPassword("123456");
            tempOro.setEstadoRegistro(EstadoRegistro.ACTIVO);
            
            Cliente cOro = new Cliente();
            cOro.setNombre("Test Oro");
            cOro.setDocumento("99998888");
            cOro.setCategoria("oro");

            Duenio dOro = new Duenio();
            dOro.setNombre("Test Oro");
            dOro.setDocumento("99998888");
            dOro.setVerificador(admin);
            
            tempOro.setCliente(cOro);
            tempOro.setDuenio(dOro);
            
            uOro = usuarioRepository.save(tempOro);
        } else {
            uOro = optOro.get();
            if (uOro.getCliente() != null) {
                // Check if specific cards are present
                boolean hasVisa = medioDePagoRepository.findByCliente_Identificador(uOro.getCliente().getIdentificador())
                                    .stream().anyMatch(mp -> "4000123456789010".equals(mp.getNumero()));
                if (!hasVisa) {
                    MedioDePago mpValida = new MedioDePago();
                    mpValida.setCliente(uOro.getCliente());
                    mpValida.setTipo("TARJETA");
                    mpValida.setEntidad("VISA ORO");
                    mpValida.setNumero("4000123456789010");
                    mpValida.setTitular("TEST ORO");
                    mpValida.setVerificado(true);
                    mpValida.setMontoGarantia(new java.math.BigDecimal("50000.00")); // Valid funds
                    medioDePagoRepository.save(mpValida);

                    MedioDePago mpInvalida = new MedioDePago();
                    mpInvalida.setCliente(uOro.getCliente());
                    mpInvalida.setTipo("TARJETA");
                    mpInvalida.setEntidad("MASTERCARD");
                    mpInvalida.setNumero("5000123456780000");
                    mpInvalida.setTitular("TEST ORO");
                    mpInvalida.setVerificado(true);
                    mpInvalida.setMontoGarantia(new java.math.BigDecimal("10.00")); // Insufficient funds
                    medioDePagoRepository.save(mpInvalida);
                }
                uOro.getCliente().setCategoria("oro");
                clienteRepository.save(uOro.getCliente());
                usuarioRepository.save(uOro);
            }
        }

        Duenio duenioBase = duenioRepository.findAll().stream().filter(d -> "11111111".equals(d.getDocumento())).findFirst().orElseGet(() -> {
            Duenio d = new Duenio();
            d.setNombre("Juan Perez");
            d.setDocumento("11111111");
            d.setVerificador(admin);
            return duenioRepository.save(d);
        });

        // -------------------------
        // SUBSTAS PARA PARTICIPAR
        // -------------------------
        // Crear Seguro Demo
        String nroPolizaDemo = "POLIZA-DEMO-123";
        if (seguroRepository.findById(nroPolizaDemo).isEmpty()) {
            Seguro s = new Seguro();
            s.setNroPoliza(nroPolizaDemo);
            s.setCompania("La Segunda Seguros");
            s.setPolizaCombinada("si");
            s.setImporte(new java.math.BigDecimal("10000.00"));
            seguroRepository.save(s);
        }

        // Subasta 1: EN VIVO
        // Buscar la subasta 1 existente
        Optional<Subasta> optS1 = subastaRepository.findById(1L);
        final Subasta s1;
        if (optS1.isPresent()) {
            s1 = optS1.get();
        } else {
            s1 = new Subasta();
            s1.setCapacidadAsistentes(100);
            s1.setTieneDeposito("si");
            s1.setSeguridadPropia("si");
            s1.setCategoria("comun");
            s1.setFecha(LocalDate.now());
        s1.setHora(LocalTime.of(1, 5));
            s1.setEstado("abierta");
            
            // SAVE SUBASTA BEFORE CATALOGO TO PREVENT TRANSIENT EXCEPTION
            subastaRepository.save(s1);

            Catalogo c = new Catalogo();
            c.setDescripcion("Subasta de Relojería y Arte");
            c.setResponsable(admin);
            c.setSubasta(s1);
            catalogoRepository.save(c);

            Producto p1 = createDemoItem(c, "Reloj Vintage Suizo", admin, duenioBase, "disponible");
            p1.setSeguro(nroPolizaDemo);
            productoRepository.save(p1);
        }

        // Forzar la subasta a estar abierta, hoy a las 17:00
        s1.setFecha(LocalDate.now());
        s1.setHora(LocalTime.of(1, 5));
        s1.setEstado("abierta");
        subastaRepository.save(s1);

        // Volver a poner todos los items de este catálogo como NO subastados
        List<Catalogo> catalogosS1 = catalogoRepository.findBySubastaIdentificador(s1.getIdentificador());
        for (Catalogo cat : catalogosS1) {
            List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoIdentificador(cat.getIdentificador());
            for (ItemCatalogo item : items) {
                item.setSubastado("no");
                itemCatalogoRepository.save(item);
            }
        }

        // Register test user to Subasta 1
        boolean isRegistered = asistenteRepository.findAll().stream()
            .anyMatch(a -> a.getCliente().getIdentificador().equals(u1.getCliente().getIdentificador()) && a.getSubasta().getIdentificador().equals(s1.getIdentificador()));
        if (!isRegistered) {
            Asistente a = new Asistente();
            a.setCliente(u1.getCliente());
            a.setSubasta(s1);
            a.setNumeroPostor((int)(Math.random() * 1000) + 1);
            asistenteRepository.save(a);
        }

        // Register oro user to Subasta 1 so they can test it too
        boolean isOroRegistered = asistenteRepository.findAll().stream()
            .anyMatch(a -> a.getCliente().getIdentificador().equals(uOro.getCliente().getIdentificador()) && a.getSubasta().getIdentificador().equals(s1.getIdentificador()));
        if (!isOroRegistered) {
            Asistente aOro = new Asistente();
            aOro.setCliente(uOro.getCliente());
            aOro.setSubasta(s1);
            aOro.setNumeroPostor((int)(Math.random() * 1000) + 1);
            asistenteRepository.save(aOro);
        }

        // Subasta 2: FUTURA (Comentada para que no aparezca el Cuadro Picasso)
        /*
        boolean hasFutura = subastaRepository.findAll().stream().anyMatch(s -> "abierta".equals(s.getEstado()) && s.getHora().isAfter(LocalTime.now()) && "comun".equals(s.getCategoria()));
        if (!hasFutura) {
            Subasta s2 = new Subasta();
            s2.setFecha(LocalDate.now());
            s2.setHora(LocalTime.now().plusHours(3));
            s2.setEstado("abierta"); // En lugar de programada, para cumplir con el check constraint (abierta o cerrada)
            s2.setUbicacion("Rivadavia 3421");
            s2.setCapacidadAsistentes(500);
            s2.setTieneDeposito("no");
            s2.setSeguridadPropia("no");
            s2.setCategoria("comun");
            s2 = subastaRepository.save(s2);

            Catalogo c2 = new Catalogo();
            c2.setDescripcion("Subasta Futura");
            c2.setResponsable(admin);
            c2.setSubasta(s2);
            catalogoRepository.save(c2);

            createDemoItem(c2, "Cuadro Picasso Replica", admin, duenioBase, "disponible");
        }
        */

        // Subasta 3: EXCLUSIVA (oro)
        boolean hasOro = subastaRepository.findAll().stream().anyMatch(s -> "oro".equals(s.getCategoria()));
        if (!hasOro) {
            Subasta s3 = new Subasta();
            s3.setFecha(LocalDate.now().plusDays(2));
            s3.setHora(LocalTime.of(20, 0));
            s3.setEstado("abierta"); // En lugar de programada, para cumplir con el check constraint
            s3.setUbicacion("Rivadavia 3421");
            s3.setCapacidadAsistentes(50);
            s3.setTieneDeposito("si");
            s3.setSeguridadPropia("si");
            s3.setCategoria("oro");
            s3 = subastaRepository.save(s3);

            Catalogo c3 = new Catalogo();
            c3.setDescripcion("Subasta Exclusiva ORO");
            c3.setResponsable(admin);
            c3.setSubasta(s3);
            catalogoRepository.save(c3);

            createDemoItem(c3, "Ferrari 250 GTO 1962", admin, duenioBase, "disponible");
        }

        // -------------------------
        // HISTORIAL Y ESTADISTICAS
        // -------------------------
        // Limpiar deudas accidentales viejas del usuario Test
        List<Deuda> testDebts = deudaRepository.findByUsuarioIdUsuario(u1.getIdUsuario());
        for (Deuda d : testDebts) {
            deudaRepository.delete(d);
        }

        // Generar Historial Ganado para Usuario TEST
        if (pujoRepository.findByAsistenteIdentificador(u1.getCliente().getIdentificador()).isEmpty()) {
            // Subasta pasada 1: Jarrón Dinastía Ming - PAGADA
            Subasta sh1 = createHistoricalSubasta("Subasta Pasada 1", admin);
            Asistente ah1 = createAsistente(u1.getCliente(), sh1);
            ItemCatalogo ih1 = createHistoricalItem(sh1, "Jarrón Dinastía Ming", admin, duenioBase);
            createWinningPujo(ah1, ih1, new BigDecimal("1500.00"));

            // Crear deuda PAGADA para Jarrón
            Deuda d1 = new Deuda();
            d1.setUsuario(u1);
            d1.setMonto(new BigDecimal("1500.00"));
            d1.setMotivo("Adjudicación Item de Subasta " + ih1.getIdentificador());
            d1.setPagada(true);
            d1.setFechaPago(LocalDateTime.now().minusDays(8));
            d1.setMedioPagoUsado("VISA ****3704");
            d1.setMetodoEnvio("domicilio");
            d1.setRenunciaSeguro(false);
            deudaRepository.save(d1);

            // Subasta pasada 2: Silla Luis XV - PAGADA
            Subasta sh2 = createHistoricalSubasta("Subasta Pasada 2", admin);
            Asistente ah2 = createAsistente(u1.getCliente(), sh2);
            ItemCatalogo ih2 = createHistoricalItem(sh2, "Silla Luis XV", admin, duenioBase);
            createWinningPujo(ah2, ih2, new BigDecimal("850.00"));

            // Crear deuda PAGADA para Silla
            Deuda d2 = new Deuda();
            d2.setUsuario(u1);
            d2.setMonto(new BigDecimal("850.00"));
            d2.setMotivo("Adjudicación Item de Subasta " + ih2.getIdentificador());
            d2.setPagada(true);
            d2.setFechaPago(LocalDateTime.now().minusDays(5));
            d2.setMedioPagoUsado("VISA ****3704");
            d2.setMetodoEnvio("retiro");
            d2.setRenunciaSeguro(true);
            deudaRepository.save(d2);

            // Subasta pasada 3: Collar de Perlas - PENDIENTE DE PAGO
            Subasta sh3 = createHistoricalSubasta("Subasta Reciente (Con Deuda)", admin);
            Asistente ah3 = createAsistente(u1.getCliente(), sh3);
            ItemCatalogo ih3 = createHistoricalItem(sh3, "Collar de Perlas", admin, duenioBase);
            createWinningPujo(ah3, ih3, new BigDecimal("2300.00"));

            // Crear deuda PENDIENTE para Collar
            Deuda d3 = new Deuda();
            d3.setUsuario(u1);
            d3.setMonto(new BigDecimal("2300.00"));
            d3.setMotivo("Adjudicación Item de Subasta " + ih3.getIdentificador());
            d3.setPagada(false);
            deudaRepository.save(d3);

            // Notificaciones tipadas
            createNotificacion(u1, "¡Felicidades! Ganaste la subasta de la Silla Luis XV. Por favor, selecciona el método de pago y envío en Subastas Ganadas.", "subasta_ganada", ih2.getIdentificador());
            createNotificacion(u1, "Tienes un pago pendiente por el Collar de Perlas. Dirígete a Subastas Ganadas para completarlo.", "subasta_ganada", ih3.getIdentificador());
        }

        // Generar Historial Ganado, Deuda, y Productos Vendedor para Usuario ORO
        if (deudaRepository.findByUsuarioIdUsuario(uOro.getIdUsuario()).isEmpty()) {
            Subasta shOro = createHistoricalSubasta("Subasta Exclusiva Pasada", admin);
            Asistente ahOro = createAsistente(uOro.getCliente(), shOro);
            ItemCatalogo ihOro = createHistoricalItem(shOro, "Diamante Bruto", admin, duenioBase);
            createWinningPujo(ahOro, ihOro, new BigDecimal("10000.00"));

            Deuda deudaOro = new Deuda();
            deudaOro.setUsuario(uOro);
            deudaOro.setMonto(new BigDecimal("10000.00"));
            deudaOro.setMotivo("Pago por adjudicación de Diamante Bruto");
            deudaOro.setPagada(false);
            deudaRepository.save(deudaOro);

            // 3 Productos del Usuario Oro como Vendedor
            Producto p1 = createDemoItem(null, "Estatua de Mármol", admin, uOro.getDuenio(), "Pendiente de Envío");
            createNotificacion(uOro, "Debes enviar tu artículo 'Estatua de Mármol' a la sucursal de Buenos Aires en las próximas 48 horas.", "general", null);

            Producto p2 = createDemoItem(null, "Reloj Patek Philippe", admin, uOro.getDuenio(), "En validación");
            createNotificacion(uOro, "Hemos recibido tu artículo 'Reloj Patek Philippe'. Nuestros tasadores lo están validando.", "producto_tasado", p2.getIdentificador().longValue());

            Producto p3 = createDemoItem(null, "Anillo de Zafiro", admin, uOro.getDuenio(), "Con Oferta");
            createNotificacion(uOro, "¡Tienes una oferta sugerida de 5,000 USD por tu artículo 'Anillo de Zafiro'! Revisa tus productos para aceptar o rechazar.", "producto_tasado", p3.getIdentificador().longValue());
        }
    }

    private Subasta createHistoricalSubasta(String name, Empleado admin) {
        Subasta s = new Subasta();
        s.setFecha(LocalDate.now().minusDays(10));
        s.setHora(LocalTime.of(15, 0));
        s.setEstado("cerrada");
        s.setUbicacion("Histórica");
        s.setCapacidadAsistentes(100);
        s.setTieneDeposito("no");
        s.setSeguridadPropia("no");
        s.setCategoria("comun");
        s = subastaRepository.save(s);
        
        Catalogo c = new Catalogo();
        c.setDescripcion(name);
        c.setResponsable(admin);
        c.setSubasta(s);
        catalogoRepository.save(c);
        return s;
    }

    private Asistente createAsistente(Cliente cliente, Subasta subasta) {
        Asistente a = new Asistente();
        a.setCliente(cliente);
        a.setSubasta(subasta);
        a.setNumeroPostor((int)(Math.random() * 1000) + 1);
        return asistenteRepository.save(a);
    }

    private ItemCatalogo createHistoricalItem(Subasta s, String nombre, Empleado admin, Duenio duenio) {
        Catalogo c = catalogoRepository.findAll().stream().filter(cat -> cat.getSubasta().getIdentificador().equals(s.getIdentificador())).findFirst().get();
        Producto p = createDemoItem(c, nombre, admin, duenio, "Subastado");
        
        ItemCatalogo ic = itemCatalogoRepository.findAll().stream().filter(item -> item.getProducto().getIdentificador().equals(p.getIdentificador())).findFirst().get();
        ic.setSubastado("si");
        return itemCatalogoRepository.save(ic);
    }

    private void createWinningPujo(Asistente a, ItemCatalogo ic, BigDecimal importe) {
        Pujo p = new Pujo();
        p.setAsistente(a);
        p.setItem(ic);
        p.setImporte(importe);
        p.setGanador("si");
        pujoRepository.save(p);
    }

    private void createNotificacion(Usuario u, String msj, String tipo, Long referenciaId) {
        if (u == null || u.getIdUsuario() == null) return;
        Notificacion n = new Notificacion();
        Usuario ref = new Usuario();
        ref.setIdUsuario(u.getIdUsuario());
        n.setUsuario(ref);
        n.setMensaje(msj);
        n.setLeida(false);
        n.setTipo(tipo != null ? tipo : "general");
        n.setReferenciaId(referenciaId);
        n.setFechaCreacion(LocalDateTime.now());
        notificacionRepository.save(n);
    }

    private Producto createDemoItem(Catalogo c, String nombre, Empleado admin, Duenio duenio, String estado) {
        Producto p = new Producto();
        p.setDescripcionCatalogo(nombre); // <- This is now the TITLE in the UI
        if (nombre.contains("Reloj Vintage")) {
            p.setDescripcionCompleta("Atractivo reloj de pulsera vintage [Años 1960-1969] en muy buen estado de conservación. Una pieza clásica y elegante, perfecta para coleccionistas o para uso diario con un toque distinguido.");
        } else {
            p.setDescripcionCompleta("Estado: " + estado + ". Excelente pieza de colección en muy buen estado. " + nombre + " listo para ser adquirido en subasta.");
        }
        p.setDisponible("no"); // En inventario o subasta no está "disponible" para uso normal
        // Ya no sobrescribimos descripcionCatalogo con el estado.
        p.setRevisor(admin);
        p.setDuenio(duenio);
        p.setFecha(LocalDate.now());
        p = productoRepository.save(p);

        Foto f = new Foto();
        f.setProducto(p);
        f.setFoto("https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=200".getBytes(StandardCharsets.UTF_8));
        fotoRepository.save(f);

        if (c != null) {
            ItemCatalogo ic = new ItemCatalogo();
            ic.setCatalogo(c);
            ic.setProducto(p);
            ic.setPrecioBase(new BigDecimal("100.00"));
            ic.setComision(new BigDecimal("10.00"));
            ic.setSubastado("no");
            itemCatalogoRepository.save(ic);
        }

        return p;
    }
}
