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
    private final FotoRepository fotoRepository;
    private final SeguroRepository seguroRepository;

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
        producto = productoRepository.save(producto);

        // Guardar las fotos subidas
        if (request.getFotosUrls() != null && !request.getFotosUrls().isEmpty()) {
            for (String base64Url : request.getFotosUrls()) {
                try {
                    // Guardamos el string base64 original directamente para que AuctionController lo levante tal cual.
                    byte[] imageBytes = base64Url.getBytes(java.nio.charset.StandardCharsets.UTF_8);
                    
                    Foto foto = new Foto();
                    foto.setProducto(producto);
                    foto.setFoto(imageBytes);
                    fotoRepository.save(foto);
                } catch (Exception e) {
                    System.err.println("Error decodificando o guardando foto: " + e.getMessage());
                }
            }
        }

        // No enviamos tasación inmediata aquí. Retornamos el ID del producto para que el frontend siga el flujo.

        return ResponseEntity.status(HttpStatus.CREATED).body(java.util.Map.of("message", "Propuesta enviada correctamente", "productoId", producto.getIdentificador()));
    }

    @PostMapping("/{id}/simulate-receive")
    public ResponseEntity<?> simulateReceiveAndAppraisal(@PathVariable Long id, @RequestParam String email) {
        Optional<Producto> prodOpt = productoRepository.findById(id);
        Optional<Usuario> userOpt = usuarioRepository.findByEmail(email);

        if (prodOpt.isEmpty() || userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Producto o usuario inválido.");
        }
        
        Producto producto = prodOpt.get();
        Usuario usuario = userOpt.get();

        // 1. Notificación de RECIBIDO
        Notificacion notifRecibido = new Notificacion();
        notifRecibido.setUsuario(usuario);
        notifRecibido.setMensaje("Tu producto '" + producto.getDescripcionCatalogo() + "' ha sido RECIBIDO en Rivadavia 3421 y se encuentra en proceso de tasación.");
        notifRecibido.setTipo("producto_recibido");
        notifRecibido.setReferenciaId(producto.getIdentificador().longValue());
        notifRecibido.setFechaCreacion(LocalDateTime.now());
        notificacionRepository.save(notifRecibido);

        // Lógica de SEGURO (Monto base simulado: 1500)
        java.math.BigDecimal valorBase = new java.math.BigDecimal("1500.00");
        String basePoliza = "POL-" + usuario.getDuenio().getIdentificador();
        
        java.util.Optional<Seguro> optSeguro = seguroRepository.findByNroPoliza(basePoliza);
        Seguro seguro;
        if (optSeguro.isPresent()) {
            seguro = optSeguro.get();
            seguro.setImporte(seguro.getImporte().add(valorBase));
            seguro.setPolizaCombinada("si");
        } else {
            seguro = new Seguro();
            seguro.setNroPoliza(basePoliza);
            seguro.setCompania("Aseguradora SubastasYa S.A.");
            seguro.setImporte(valorBase);
            seguro.setPolizaCombinada("no");
        }
        seguroRepository.save(seguro);
        
        producto.setSeguro(seguro.getNroPoliza());
        productoRepository.save(producto);

        // 2. Notificación de TASADO (Simulada después de recibir)
        Notificacion notifTasado = new Notificacion();
        notifTasado.setUsuario(usuario);
        LocalDate fechaSugerida = LocalDate.parse("2026-10-10");
        notifTasado.setMensaje("Tu producto '" + producto.getDescripcionCatalogo() + "' ha sido tasado.\n" +
                               "- Precio Base Sugerido: USD 1500.\n" +
                               "- Comisión Empresa: 15%.\n" +
                               "- Fecha sugerida: " + fechaSugerida.toString() + ".\n" +
                               "- Hora: 10:00 AM.\n" +
                               "- Lugar: Rivadavia 3421, CABA.\n" +
                               "Por favor, toma una decisión desde tu panel.");
        notifTasado.setTipo("producto_tasado");
        notifTasado.setReferenciaId(producto.getIdentificador().longValue());
        notifTasado.setFechaCreacion(LocalDateTime.now().plusMinutes(1)); // Un minuto después para ordenar
        notificacionRepository.save(notifTasado);

        return ResponseEntity.ok("Flujo simulado completado.");
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
            subasta.setNombre("Subasta Automática - " + p.getDescripcionCatalogo());
            subasta.setFecha(LocalDate.parse("2026-10-10"));
            subasta.setHora(java.time.LocalTime.of(10, 0));
            subasta.setUbicacion("Rivadavia 3421");
            subasta.setEstado("programada");
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
            
            // Eliminar la notificación de tasación para evitar generacion de deudas infinitas
            java.util.List<Notificacion> notifs = notificacionRepository.findByUsuarioIdUsuario(u.getIdUsuario());
            notifs.stream()
                .filter(n -> "producto_tasado".equals(n.getTipo()) && n.getReferenciaId().equals(p.getIdentificador().longValue()))
                .forEach(notificacionRepository::delete);

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
