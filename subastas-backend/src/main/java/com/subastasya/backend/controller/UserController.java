package com.subastasya.backend.controller;

import com.subastasya.backend.model.*;
import com.subastasya.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UsuarioRepository usuarioRepository;
    private final MedioDePagoRepository medioDePagoRepository;
    private final DeudaRepository deudaRepository;
    private final NotificacionRepository notificacionRepository;
    private final PujoRepository pujoRepository;
    private final AsistenteRepository asistenteRepository;
    private final ProductoRepository productoRepository;

    @GetMapping("/me/payments")
    public ResponseEntity<?> obtenerMediosDePago(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(medioDePagoRepository.findByCliente_Identificador(opt.get().getCliente().getIdentificador()));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getProfile(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(opt.get());
    }

    @GetMapping("/me/debts")
    public ResponseEntity<?> getDebts(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(deudaRepository.findByUsuarioIdUsuario(opt.get().getIdUsuario()));
    }

    @PostMapping("/me/debts/{id}/pay")
    public ResponseEntity<?> payDebt(@PathVariable Long id) {
        Optional<Deuda> deudaOpt = deudaRepository.findById(id);
        if (deudaOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Deuda deuda = deudaOpt.get();
        deuda.setPagada(true);
        deudaRepository.save(deuda);
        return ResponseEntity.ok("Deuda pagada correctamente.");
    }

    @GetMapping("/me/notifications")
    public ResponseEntity<?> getNotifications(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(notificacionRepository.findByUsuarioIdUsuario(opt.get().getIdUsuario()));
    }

    @GetMapping("/me/metrics")
    public ResponseEntity<?> getMetrics(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();

        int totalPujas = 0;
        int subastasParticipadas = 0;
        int ventasRealizadas = 0;

        if (user.getCliente() != null) {
            List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
            subastasParticipadas = asistentes.size();
            for (Asistente a : asistentes) {
                totalPujas += pujoRepository.findByAsistenteIdentificador(a.getIdentificador()).size();
            }
        }
        
        if (user.getDuenio() != null) {
            ventasRealizadas = productoRepository.findByDuenioIdentificador(user.getDuenio().getIdentificador()).size();
        }

        Map<String, Integer> metrics = new HashMap<>();
        metrics.put("totalPujas", totalPujas);
        metrics.put("subastasParticipadas", subastasParticipadas);
        metrics.put("ventasRealizadas", ventasRealizadas);

        return ResponseEntity.ok(metrics);
    }
}
