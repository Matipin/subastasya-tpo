package com.subastasya.backend.controller;

import com.subastasya.backend.controller.dto.ProposeRequest;
import com.subastasya.backend.model.*;
import com.subastasya.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Optional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/items")
@RequiredArgsConstructor
public class ItemController {

    private final ProductoRepository productoRepository;
    private final UsuarioRepository usuarioRepository;
    private final DuenioRepository duenioRepository;
    private final EmpleadoRepository empleadoRepository;
    private final DeudaRepository deudaRepository;
    private final NotificacionRepository notificacionRepository;
    private final SubastaRepository subastaRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;

    @PostMapping("/propose")
    public ResponseEntity<?> proposeItem(@RequestBody ProposeRequest request) {
        if (request.getEmail() == null) {
            return ResponseEntity.badRequest().body("Email requerido");
        }
        if (!request.isDeclaraPropiedad()) {
            return ResponseEntity.badRequest().body("Debe declarar que el bien le pertenece y no posee impedimento legal.");
        }
        if (!request.isAceptaDevolucion()) {
            return ResponseEntity.badRequest().body("Debe aceptar que en caso de rechazo, la empresa devolverá el bien con cargo.");
        }
        
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        }
        Usuario usuario = userOpt.get();

        // Obtener o crear Dueño
        Duenio duenio = usuario.getDuenio();
        if (duenio == null) {
            duenio = new Duenio();
            duenio.setNombre(usuario.getCliente().getNombre());
            duenio.setDocumento(usuario.getCliente().getDocumento());
            duenio.setDireccion(usuario.getCliente().getDireccion());
            duenio.setEstado("activo");
            duenio.setVerificacionFinanciera("si");
            duenio.setVerificacionJudicial("si");
            duenio.setCalificacionRiesgo(1);
            duenio = duenioRepository.save(duenio);
            usuario.setDuenio(duenio);
            usuarioRepository.save(usuario);
        }

        // Obtener un revisor (Empleado) dummy
        Empleado revisor = empleadoRepository.findAll().stream().findFirst().orElseGet(() -> {
            Empleado emp = new Empleado();
            emp.setNombre("Revisor Dummy");
            emp.setDocumento("DOC-REV-1");
            emp.setEstado("activo");
            emp.setCargo("Tasador");
            return empleadoRepository.save(emp);
        });

        // Construir descripción completa con historia si existe
        StringBuilder descCompleta = new StringBuilder();
        descCompleta.append(request.getDescripcion() != null ? request.getDescripcion() : "Sin descripción");
        if (request.getHistoria() != null && !request.getHistoria().isEmpty()) {
            descCompleta.append(" | Historia: ").append(request.getHistoria());
        }
        if (request.getArtista() != null && !request.getArtista().isEmpty()) {
            descCompleta.append(" | Artista/Diseñador: ").append(request.getArtista());
        }

        Producto producto = new Producto();
        producto.setDuenio(duenio);
        producto.setRevisor(revisor);
        producto.setFecha(LocalDate.now());
        producto.setDisponible("no"); // Pendiente de decisión
        producto.setDescripcionCompleta(descCompleta.toString());
        producto.setDescripcionCatalogo(request.getNombre() != null ? request.getNombre() : "Obra Nueva");
        productoRepository.save(producto);

        // Simulamos tasación inmediata: creamos Notificación
        Notificacion notif = new Notificacion();
        notif.setUsuario(usuario);
        LocalDate fechaSugerida = LocalDate.now().plusDays(15);
        notif.setMensaje("Tu producto '" + producto.getDescripcionCatalogo() + "' ha sido tasado. Precio Base Sugerido: USD 1500. Fecha de subasta: " + fechaSugerida.toString() + ". Por favor, toma una decisión desde tu panel.");
        notif.setTipo("producto_tasado");
        notif.setReferenciaId(producto.getIdentificador().longValue());
        notif.setFechaCreacion(LocalDateTime.now());
        notificacionRepository.save(notif);

        return ResponseEntity.status(HttpStatus.CREATED).body("Propuesta enviada correctamente");
    }

    @GetMapping("/propose/status")
    public ResponseEntity<?> getProposeStatus(@RequestParam Long id) {
        Optional<Producto> productoOpt = productoRepository.findById(id);
        if (productoOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Producto no encontrado.");
        }
        Producto p = productoOpt.get();
        return ResponseEntity.ok("Estado del producto: " + (p.getDisponible().equals("si") ? "Aceptado" : "Pendiente/Rechazado"));
    }

    @GetMapping("/{id}/tracking")
    public ResponseEntity<?> getTracking(@PathVariable Long id) {
        return ResponseEntity.ok("Ubicación: Depósito Central - Seguro Póliza vinculada al producto " + id);
    }

    @PatchMapping("/{id}/insurance")
    public ResponseEntity<?> updateInsurance(@PathVariable Long id) {
        return ResponseEntity.ok("Póliza actualizada para producto " + id);
    }

    @PostMapping("/{id}/decision")
    public ResponseEntity<?> ownerDecision(@PathVariable Long id, @RequestParam String decision, @RequestParam String email) {
        Optional<Producto> prodOpt = productoRepository.findById(id);
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);

        if (prodOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Producto o usuario inválido.");
        }

        Producto p = prodOpt.get();
        Usuario u = userOpt.get();

        if ("aceptar".equalsIgnoreCase(decision)) {
            p.setDisponible("si");
            productoRepository.save(p);
            
            // Crear Subasta
            Subasta subasta = new Subasta();
            subasta.setFecha(LocalDate.now().plusDays(15));
            subasta.setHora(java.time.LocalTime.of(14, 0));
            subasta.setEstado("abierta");
            subasta.setCategoria("comun");
            subasta.setUbicacion("Sede Central, CABA");
            subasta.setCapacidadAsistentes(100);
            subasta.setTieneDeposito("si");
            subasta.setSeguridadPropia("si");
            subasta = subastaRepository.save(subasta);

            // Crear Catalogo
            Catalogo catalogo = new Catalogo();
            catalogo.setDescripcion("Catálogo Especial - " + p.getDescripcionCatalogo());
            catalogo.setSubasta(subasta);
            catalogo.setResponsable(p.getRevisor());
            catalogo = catalogoRepository.save(catalogo);

            // Crear ItemCatalogo
            ItemCatalogo itemCat = new ItemCatalogo();
            itemCat.setCatalogo(catalogo);
            itemCat.setProducto(p);
            itemCat.setPrecioBase(new BigDecimal("1500.00"));
            itemCat.setComision(new BigDecimal("15.00"));
            itemCat.setSubastado("no");
            itemCatalogoRepository.save(itemCat);

            Notificacion notif = new Notificacion();
            notif.setUsuario(u);
            notif.setMensaje("Has aceptado la tasación para '" + p.getDescripcionCatalogo() + "'. El producto pasará al catálogo principal.");
            notif.setTipo("producto_tasado");
            notif.setReferenciaId(p.getIdentificador().longValue());
            notif.setFechaCreacion(LocalDateTime.now());
            notificacionRepository.save(notif);
            
            return ResponseEntity.ok("Producto aceptado e ingresado al catálogo.");
        } else if ("rechazar".equalsIgnoreCase(decision)) {
            p.setDisponible("no"); // Se queda rechazado
            productoRepository.save(p);
            
            Deuda deuda = new Deuda();
            deuda.setUsuario(u);
            deuda.setMonto(new BigDecimal("50.00")); // Cargo por envío
            deuda.setMotivo("Cargo de envío por rechazo de tasación: " + p.getDescripcionCatalogo());
            deudaRepository.save(deuda);

            Notificacion notif = new Notificacion();
            notif.setUsuario(u);
            notif.setMensaje("Has rechazado la tasación para '" + p.getDescripcionCatalogo() + "'. Se ha generado una deuda de USD 50 por gastos operativos de envío de retorno.");
            notif.setTipo("deuda");
            notif.setReferenciaId(deuda.getId());
            notif.setFechaCreacion(LocalDateTime.now());
            notificacionRepository.save(notif);

            return ResponseEntity.ok("Producto rechazado. Se ha generado cargo de envío.");
        }
        
        return ResponseEntity.badRequest().body("Decisión no válida.");
    }
}
