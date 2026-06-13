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

    @PostMapping("/propose")
    public ResponseEntity<?> proposeItem(@RequestBody ProposeRequest request) {
        if (request.getEmail() == null) {
            return ResponseEntity.badRequest().body("Email requerido");
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

        Producto producto = new Producto();
        producto.setDuenio(duenio);
        producto.setRevisor(revisor);
        producto.setFecha(LocalDate.now());
        producto.setDisponible("no"); // Pendiente de decisión
        producto.setDescripcionCompleta(request.getDescripcion() != null ? request.getDescripcion() : "Sin descripción");
        producto.setDescripcionCatalogo(request.getNombre() != null ? request.getNombre() : "Obra Nueva");
        productoRepository.save(producto);

        // Simulamos tasación inmediata: creamos Notificación
        Notificacion notif = new Notificacion();
        notif.setUsuario(usuario);
        notif.setMensaje("Tu producto '" + producto.getDescripcionCatalogo() + "' ha sido tasado. Precio Base Sugerido: USD 500. Por favor, toma una decisión desde tu panel.");
        notificacionRepository.save(notif);

        return ResponseEntity.status(HttpStatus.CREATED).body(producto);
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
            
            Notificacion notif = new Notificacion();
            notif.setUsuario(u);
            notif.setMensaje("Has aceptado la tasación para '" + p.getDescripcionCatalogo() + "'. El producto pasará al catálogo.");
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
            notificacionRepository.save(notif);

            return ResponseEntity.ok("Producto rechazado. Se ha generado cargo de envío.");
        }
        
        return ResponseEntity.badRequest().body("Decisión no válida.");
    }
}
