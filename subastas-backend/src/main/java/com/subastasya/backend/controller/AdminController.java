package com.subastasya.backend.controller;

import com.subastasya.backend.controller.dto.AdminAprobarRequest;
import com.subastasya.backend.controller.dto.AdminRechazarRequest;
import com.subastasya.backend.controller.dto.AdminVerificarPagoRequest;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.model.EstadoRegistro;
import com.subastasya.backend.model.MedioDePago;
import com.subastasya.backend.repository.ClienteRepository;
import com.subastasya.backend.repository.MedioDePagoRepository;
import com.subastasya.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final ClienteRepository clienteRepository;
    private final MedioDePagoRepository medioDePagoRepository;
    private final EmailService emailService;

    // ─────────────────────────────────────────────
    // 1. Obtener usuarios pendientes de validación
    // ─────────────────────────────────────────────
    @GetMapping("/usuarios-pendientes")
    public ResponseEntity<List<Cliente>> getUsuariosPendientes() {
        List<Cliente> pendientes = clienteRepository.findAll().stream()
                .filter(c -> c.getEstadoRegistro() == EstadoRegistro.PENDIENTE_VALIDACION)
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendientes);
    }

    // ─────────────────────────────────────────────
    // 2. Aprobar un usuario y enviar token
    // ─────────────────────────────────────────────
    @PostMapping("/aprobar-usuario")
    public ResponseEntity<?> aprobarUsuario(@RequestBody AdminAprobarRequest request) {
        Optional<Cliente> opt = clienteRepository.findByEmail(request.getEmail());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        Cliente usuario = opt.get();
        if (usuario.getEstadoRegistro() != EstadoRegistro.PENDIENTE_VALIDACION) {
            return ResponseEntity.badRequest().body("El usuario no está pendiente de validación");
        }

        // Generar token y cambiar estado
        String token = UUID.randomUUID().toString();
        usuario.setActivationToken(token);
        usuario.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
        
        // Asignar categoría (o por defecto COMUN si no la mandan)
        if (request.getCategoria() != null && !request.getCategoria().isBlank()) {
            usuario.setCategoria(request.getCategoria().toUpperCase());
        } else {
            usuario.setCategoria("COMUN");
        }

        try {
            emailService.sendActivationEmail(usuario.getEmail(), token);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al enviar el email al usuario. Revisa las credenciales SMTP en application.properties");
        }

        clienteRepository.save(usuario);
        return ResponseEntity.ok("Usuario aprobado correctamente. Correo enviado.");
    }

    // ─────────────────────────────────────────────
    // 2.5. Aprobar a TODOS los usuarios pendientes (Atajo para testing)
    // ─────────────────────────────────────────────
    @PostMapping("/aprobar-todos")
    public ResponseEntity<?> aprobarTodos() {
        List<Cliente> pendientes = clienteRepository.findAll().stream()
                .filter(c -> c.getEstadoRegistro() == EstadoRegistro.PENDIENTE_VALIDACION)
                .collect(Collectors.toList());

        int aprobados = 0;
        int fallidos = 0;

        for (Cliente usuario : pendientes) {
            String token = UUID.randomUUID().toString();
            usuario.setActivationToken(token);
            usuario.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
            usuario.setCategoria("COMUN");

            try {
                emailService.sendActivationEmail(usuario.getEmail(), token);
                clienteRepository.save(usuario);
                aprobados++;
            } catch (Exception e) {
                fallidos++;
            }
        }

        return ResponseEntity.ok("Proceso masivo completado. Aprobados: " + aprobados + " | Fallidos (error de email): " + fallidos);
    }

    // ─────────────────────────────────────────────
    // 3. Rechazar un usuario
    // ─────────────────────────────────────────────
    @PostMapping("/rechazar-usuario")
    public ResponseEntity<?> rechazarUsuario(@RequestBody AdminRechazarRequest request) {
        Optional<Cliente> opt = clienteRepository.findByEmail(request.getEmail());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado");
        }

        Cliente usuario = opt.get();
        usuario.setEstadoRegistro(EstadoRegistro.RECHAZADO);
        clienteRepository.save(usuario);

        // Opcional: Mandar email de rechazo al usuario con la razón
        System.out.println("Usuario rechazado: " + usuario.getEmail() + " | Razón: " + request.getRazon());

        return ResponseEntity.ok("Usuario rechazado correctamente.");
    }

    // ─────────────────────────────────────────────
    // 4. Ver medios de pago pendientes de verificación
    // ─────────────────────────────────────────────
    @GetMapping("/pagos-pendientes")
    public ResponseEntity<List<MedioDePago>> getPagosPendientes() {
        List<MedioDePago> pendientes = medioDePagoRepository.findAll().stream()
                .filter(p -> !p.isVerificado())
                .collect(Collectors.toList());
        return ResponseEntity.ok(pendientes);
    }

    // ─────────────────────────────────────────────
    // 5. Verificar un medio de pago
    // ─────────────────────────────────────────────
    @PostMapping("/verificar-pago")
    public ResponseEntity<?> verificarPago(@RequestBody AdminVerificarPagoRequest request) {
        Optional<MedioDePago> opt = medioDePagoRepository.findById(request.getIdPago());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Medio de pago no encontrado");
        }

        MedioDePago pago = opt.get();
        pago.setVerificado(true);
        medioDePagoRepository.save(pago);

        return ResponseEntity.ok("Medio de pago verificado y habilitado correctamente.");
    }
}
