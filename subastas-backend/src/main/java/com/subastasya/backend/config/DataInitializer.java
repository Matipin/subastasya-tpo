package com.subastasya.backend.config;

import com.subastasya.backend.model.EstadoRegistro;
import com.subastasya.backend.model.Subasta;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final ClienteRepository clienteRepository;

    @Override
    public void run(String... args) throws Exception {
        if (clienteRepository.count() == 0) {
            Cliente c1 = new Cliente();
            c1.setNombre("Usuario");
            c1.setDocumento("12345678");
            c1.setEmail("test@sello.com");
            c1.setPassword("123456");
            c1.setEstadoRegistro(EstadoRegistro.ACTIVO);
            c1.setCategoria("comun");
            clienteRepository.save(c1);

            Cliente c2 = new Cliente();
            c2.setNombre("Pendiente");
            c2.setDocumento("87654321");
            c2.setEmail("pendiente@sello.com");
            c2.setEstadoRegistro(EstadoRegistro.PENDIENTE_VALIDACION);
            c2.setCategoria("comun");
            clienteRepository.save(c2);

            Cliente c3 = new Cliente();
            c3.setNombre("Para Activar");
            c3.setDocumento("11223344");
            c3.setEmail("activar@sello.com");
            c3.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
            c3.setActivationToken("token-falso-123");
            c3.setCategoria("comun");
            clienteRepository.save(c3);
        }

        // TODO: Migrar la lógica de inicialización de Subastas, Artículos y demás
        // al nuevo modelo requerido por el profesor (Subastas, Productos, Catalogos,
        // etc.)
    }
}
