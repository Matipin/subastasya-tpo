package com.subastasya.backend.controller;

import com.subastasya.backend.controller.dto.ActivarCuentaRequest;
import com.subastasya.backend.controller.dto.ForgotPasswordRequest;
import com.subastasya.backend.controller.dto.LoginRequest;
import com.subastasya.backend.controller.dto.MedioPagoRequest;
import com.subastasya.backend.controller.dto.RegistroEtapa1Request;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.model.Usuario;
import com.subastasya.backend.model.EstadoRegistro;
import com.subastasya.backend.model.MedioDePago;
import com.subastasya.backend.repository.ClienteRepository;
import com.subastasya.backend.repository.UsuarioRepository;
import com.subastasya.backend.repository.MedioDePagoRepository;
import com.subastasya.backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private MedioDePagoRepository medioDePagoRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private com.subastasya.backend.repository.PaisRepository paisRepository;

    @PostMapping("/registro")
    public ResponseEntity<?> registroEtapa1(@RequestBody RegistroEtapa1Request request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("El email es obligatorio.");
        }

        if (usuarioRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Ya existe una cuenta con este email.");
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(request.getEmail());
        usuario.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
        String token = UUID.randomUUID().toString();
        usuario.setActivationToken(token);

        Cliente cliente = new Cliente();
        cliente.setNombre(request.getNombre() + " " + request.getApellido());
        cliente.setDireccion(request.getDomicilio());
        cliente.setDocumento("DOC-" + System.currentTimeMillis());
        
        if (request.getPais() != null && !request.getPais().isBlank()) {
            java.util.Optional<com.subastasya.backend.model.Pais> paisOpt = paisRepository.findByNombreIgnoreCase(request.getPais().trim());
            if (paisOpt.isPresent()) {
                cliente.setPais(paisOpt.get());
            } else {
                com.subastasya.backend.model.Pais nuevoPais = new com.subastasya.backend.model.Pais();
                nuevoPais.setIdentificador(paisRepository.findMaxId() + 1);
                nuevoPais.setNombre(request.getPais().trim());
                nuevoPais.setCapital("No especificada");
                nuevoPais.setNacionalidad("No especificada");
                nuevoPais.setIdiomas("No especificados");
                paisRepository.save(nuevoPais);
                cliente.setPais(nuevoPais);
            }
        }

        String fotosCombinadas = request.getUrlFotoDniFront() + "|||" + request.getUrlFotoDniBack();
        cliente.setFoto(fotosCombinadas.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        
        cliente.setCategoria("comun");
        
        usuario.setCliente(cliente);

        usuarioRepository.save(usuario);

        try {
            emailService.sendActivationEmail(usuario.getEmail(), token);
            System.out.println("Email de activación enviado correctamente a: " + usuario.getEmail());
        } catch (Exception e) {
            System.err.println("¡CRÍTICO! Error enviando email: " + e.getMessage());
            e.printStackTrace();
        }

        return ResponseEntity.status(HttpStatus.CREATED)
                .body("¡Registro exitoso! Revisa tu correo electrónico para obtener tu código de activación.");
    }

    @PostMapping("/activar")
    public ResponseEntity<?> activarCuenta(@RequestBody ActivarCuentaRequest request) {
        if (request.getToken() == null || request.getToken().isBlank()) {
            return ResponseEntity.badRequest().body("Token de activación inválido.");
        }

        Optional<Usuario> opt = usuarioRepository.findByActivationToken(request.getToken());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Token inválido o expirado.");
        }

        Usuario usuario = opt.get();

        if (usuario.getEstadoRegistro() != EstadoRegistro.APROBADO_PENDIENTE_CLAVE
                && usuario.getEstadoRegistro() != EstadoRegistro.ACTIVO) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Esta cuenta no puede usar este proceso en su estado actual.");
        }

        if (request.getPassword() == null || request.getPassword().length() < 6) {
            return ResponseEntity.badRequest()
                    .body("La contraseña debe tener al menos 6 caracteres.");
        }

        usuario.setPassword(request.getPassword());
        if (usuario.getEstadoRegistro() == EstadoRegistro.APROBADO_PENDIENTE_CLAVE) {
            usuario.setEstadoRegistro(EstadoRegistro.ACTIVO);
        }
        usuario.setActivationToken(null);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok("¡Contraseña actualizada! Ya podés iniciar sesión.");
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(request.getEmail());

        if (usuarioOpt.isPresent()) {
            Usuario usuario = usuarioOpt.get();

            if (usuario.getEstadoRegistro() == EstadoRegistro.PENDIENTE_VALIDACION) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Tu cuenta aún está pendiente de validación por un administrador.");
            }

            if (usuario.getEstadoRegistro() == EstadoRegistro.RECHAZADO) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Tu registro fue rechazado. Contactá al administrador.");
            }

            if (usuario.getEstadoRegistro() == EstadoRegistro.APROBADO_PENDIENTE_CLAVE) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body("Debés activar tu cuenta primero ingresando desde el link de tu correo (Etapa 2).");
            }

            if (usuario.getPassword() != null && usuario.getPassword().equals(request.getPassword())) {
                return ResponseEntity.ok(usuario);
            }
        }

        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body("Credenciales incorrectas.");
    }

    @PostMapping("/medio-pago")
    public ResponseEntity<?> registrarMedioPago(@RequestBody MedioPagoRequest request) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(request.getEmail());
        if (opt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Usuario no encontrado.");
        }

        if (request.getTipo() == null || request.getNumero() == null || request.getTitular() == null) {
            return ResponseEntity.badRequest()
                    .body("Todos los campos del medio de pago son obligatorios.");
        }

        Usuario usuario = opt.get();
        
        MedioDePago medioPago = new MedioDePago();
        medioPago.setCliente(usuario.getCliente());
        medioPago.setTipo(request.getTipo());
        medioPago.setNumero(request.getNumero());
        medioPago.setTitular(request.getTitular());
        medioPago.setVerificado(false);
        
        medioDePagoRepository.save(medioPago);

        return ResponseEntity.ok(usuario);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest request) {
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body("El email es obligatorio.");
        }

        Optional<Usuario> opt = usuarioRepository.findByEmail(request.getEmail().trim());
        if (opt.isPresent()) {
            Usuario usuario = opt.get();

            if (usuario.getEstadoRegistro() == EstadoRegistro.ACTIVO) {
                String token = UUID.randomUUID().toString();
                usuario.setActivationToken(token);
                usuarioRepository.save(usuario);

                try {
                    emailService.sendRecoveryEmail(usuario.getEmail(), token);
                } catch (Exception e) {
                    System.err.println("Error enviando email de recuperación: " + e.getMessage());
                }
            }
        }

        return ResponseEntity.ok(
                "Si el correo está registrado y activo, recibirás un enlace de recuperación."
        );
    }
}
