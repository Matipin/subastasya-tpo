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

    @Override
    public void run(String... args) throws Exception {
        if (usuarioRepository.count() == 0) {
            Usuario u1 = new Usuario();
            u1.setEmail("test@sello.com");
            u1.setPassword("123456");
            u1.setEstadoRegistro(EstadoRegistro.ACTIVO);
            
            Cliente c1 = new Cliente();
            c1.setNombre("Usuario");
            c1.setDocumento("12345678");
            c1.setCategoria("comun");
            
            u1.setCliente(c1);
            usuarioRepository.save(u1);

            Usuario u2 = new Usuario();
            u2.setEmail("pendiente@sello.com");
            u2.setEstadoRegistro(EstadoRegistro.PENDIENTE_VALIDACION);
            
            Cliente c2 = new Cliente();
            c2.setNombre("Pendiente");
            c2.setDocumento("87654321");
            c2.setCategoria("comun");
            
            u2.setCliente(c2);
            usuarioRepository.save(u2);

            Usuario u3 = new Usuario();
            u3.setEmail("activar@sello.com");
            u3.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
            u3.setActivationToken("token-falso-123");
            
            Cliente c3 = new Cliente();
            c3.setNombre("Para Activar");
            c3.setDocumento("11223344");
            c3.setCategoria("comun");
            
            u3.setCliente(c3);
            usuarioRepository.save(u3);
        }

        // Check if demo products exist
        boolean hasDemoProducts = productoRepository.findAll().stream()
                .anyMatch(p -> "Reloj vintage".equals(p.getDescripcionCompleta()));

        if (!hasDemoProducts) {
            Empleado admin = new Empleado();
            admin.setDocumento("99999999");
            admin.setNombre("Admin Revisor");
            admin.setCargo("Revisor y Responsable");
            empleadoRepository.save(admin);

            Duenio duenio = new Duenio();
            duenio.setNombre("Dueño Ejemplo");
            duenio.setDocumento("11111111");
            duenio.setVerificador(admin);
            duenioRepository.save(duenio);

            Subasta s1 = new Subasta();
            s1.setFecha(LocalDate.now().plusDays(15));
            s1.setHora(LocalTime.of(18, 0));
            s1.setEstado("abierta");
            s1.setUbicacion("Buenos Aires, Argentina");
            s1.setCapacidadAsistentes(100);
            s1.setTieneDeposito("si");
            s1.setSeguridadPropia("si");
            s1.setCategoria("platino");
            subastaRepository.save(s1);

            Catalogo c1 = new Catalogo();
            c1.setDescripcion("Joyas Exclusivas");
            c1.setResponsable(admin);
            c1.setSubasta(s1);
            catalogoRepository.save(c1);

            String[][] mockItems = {
                {"Reloj vintage", "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=200"},
                {"Telefono vintage", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200"},
                {"Muñeca vintage", "https://images.unsplash.com/photo-1560961811-9a742878d672?q=80&w=200"},
                {"Juego de tazas vintage", "https://images.unsplash.com/photo-1577416390772-aeb4f9408bcf?q=80&w=200"},
                {"Maquina de coser vintage", "https://images.unsplash.com/photo-1590425712128-4ceb6ba3fdfc?q=80&w=200"},
                {"Palos de golf usados por Tiger Woods", "https://images.unsplash.com/photo-1593111774240-d529f12eb416?q=80&w=200"}
            };

            for (String[] mock : mockItems) {
                Producto p = new Producto();
                p.setDescripcionCompleta(mock[0]);
                p.setDisponible("si");
                p.setRevisor(admin);
                p.setDuenio(duenio);
                p.setFecha(LocalDate.now());
                productoRepository.save(p);

                Foto f = new Foto();
                f.setProducto(p);
                f.setFoto(mock[1].getBytes(StandardCharsets.UTF_8));
                fotoRepository.save(f);

                ItemCatalogo ic = new ItemCatalogo();
                ic.setCatalogo(c1);
                ic.setProducto(p);
                ic.setPrecioBase(new BigDecimal("1000000.00"));
                ic.setComision(new BigDecimal("10000.00"));
                ic.setSubastado("no");
                itemCatalogoRepository.save(ic);
            }
        }
    }
}
