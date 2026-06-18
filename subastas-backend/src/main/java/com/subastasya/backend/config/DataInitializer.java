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
import java.time.LocalTime;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

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

    @Override
    public void run(String... args) throws Exception {
        // 1. Create or get test user (comun)
        Optional<Usuario> optU1 = usuarioRepository.findByEmail("test@sello.com");
        Usuario u1;
        if (optU1.isEmpty()) {
            u1 = new Usuario();
            u1.setEmail("test@sello.com");
            u1.setPassword("123456");
            u1.setEstadoRegistro(EstadoRegistro.ACTIVO);
            
            Cliente c1 = new Cliente();
            c1.setNombre("Test Comun");
            c1.setDocumento("12345678");
            c1.setCategoria("comun");
            
            u1.setCliente(c1);
            u1 = usuarioRepository.save(u1);
        } else {
            u1 = optU1.get();
        }

        // Create or get ORO user
        Optional<Usuario> optOro = usuarioRepository.findByEmail("oro@sello.com");
        Usuario uOro;
        if (optOro.isEmpty()) {
            uOro = new Usuario();
            uOro.setEmail("oro@sello.com");
            uOro.setPassword("123456");
            uOro.setEstadoRegistro(EstadoRegistro.ACTIVO);
            
            Cliente cOro = new Cliente();
            cOro.setNombre("Test Oro");
            cOro.setDocumento("99998888");
            cOro.setCategoria("oro");
            
            uOro.setCliente(cOro);
            uOro = usuarioRepository.save(uOro);
        }

        // Base entities
        Empleado admin = empleadoRepository.findAll().stream().filter(e -> "99999999".equals(e.getDocumento())).findFirst().orElseGet(() -> {
            Empleado e = new Empleado();
            e.setDocumento("99999999");
            e.setNombre("Admin Revisor");
            e.setCargo("Revisor y Responsable");
            return empleadoRepository.save(e);
        });

        Duenio duenio = duenioRepository.findAll().stream().filter(d -> "11111111".equals(d.getDocumento())).findFirst().orElseGet(() -> {
            Duenio d = new Duenio();
            d.setNombre("Dueño Ejemplo");
            d.setDocumento("11111111");
            d.setVerificador(admin);
            return duenioRepository.save(d);
        });

        // Subasta 1: EN VIVO (comun)
        Subasta s1 = subastaRepository.findAll().stream().filter(s -> "abierta".equals(s.getEstado()) && "comun".equals(s.getCategoria())).findFirst().orElseGet(() -> {
            Subasta s = new Subasta();
            s.setFecha(LocalDate.now());
            s.setHora(LocalTime.now().minusMinutes(5)); // Started 5 mins ago
            s.setEstado("abierta");
            s.setUbicacion("Buenos Aires, Argentina");
            s.setCapacidadAsistentes(100);
            s.setTieneDeposito("si");
            s.setSeguridadPropia("si");
            s.setCategoria("comun");
            s = subastaRepository.save(s);
            
            Catalogo c = new Catalogo();
            c.setDescripcion("Subasta En Vivo");
            c.setResponsable(admin);
            c.setSubasta(s);
            catalogoRepository.save(c);

            createDemoItem(c, "Reloj Rolex Vintage", admin, duenio);
            return s;
        });

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

        // Subasta 2: FUTURA (dentro de 3 horas)
        boolean hasFutura = subastaRepository.findAll().stream().anyMatch(s -> "programada".equals(s.getEstado()) && s.getHora().isAfter(LocalTime.now()));
        if (!hasFutura) {
            Subasta s2 = new Subasta();
            s2.setFecha(LocalDate.now());
            s2.setHora(LocalTime.now().plusHours(3));
            s2.setEstado("programada");
            s2.setUbicacion("Virtual");
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

            createDemoItem(c2, "Cuadro Picasso Replica", admin, duenio);
        }

        // Subasta 3: EXCLUSIVA (oro)
        boolean hasOro = subastaRepository.findAll().stream().anyMatch(s -> "oro".equals(s.getCategoria()));
        if (!hasOro) {
            Subasta s3 = new Subasta();
            s3.setFecha(LocalDate.now().plusDays(2));
            s3.setHora(LocalTime.of(20, 0));
            s3.setEstado("programada");
            s3.setUbicacion("Mónaco");
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

            createDemoItem(c3, "Ferrari 250 GTO 1962", admin, duenio);
        }
    }

    private void createDemoItem(Catalogo c, String nombre, Empleado admin, Duenio duenio) {
        Producto p = new Producto();
        p.setDescripcionCompleta(nombre);
        p.setDisponible("si");
        p.setRevisor(admin);
        p.setDuenio(duenio);
        p.setFecha(LocalDate.now());
        p = productoRepository.save(p);

        Foto f = new Foto();
        f.setProducto(p);
        f.setFoto("https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=200".getBytes(StandardCharsets.UTF_8));
        fotoRepository.save(f);

        ItemCatalogo ic = new ItemCatalogo();
        ic.setCatalogo(c);
        ic.setProducto(p);
        ic.setPrecioBase(new BigDecimal("100.00"));
        ic.setComision(new BigDecimal("10.00"));
        ic.setSubastado("no");
        itemCatalogoRepository.save(ic);
    }
}
