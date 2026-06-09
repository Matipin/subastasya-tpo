package com.subastasya.backend.service;

import com.subastasya.backend.model.EstadoRegistro;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.repository.ClienteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ValidationCronJob {

    private final ClienteRepository clienteRepository;
    private final EmailService emailService;

    // TODO: Quitar o cambiar esto luego según lo pedido por el profe.
    // Esto simula que un sistema externo o un humano revisa los pendientes cada 60 segundos.
    // @Scheduled(fixedRate = 60000)
    public void validatePendingUsers() {
        // Buscamos todos los usuarios que acaban de registrarse y están esperando validación
        List<Cliente> pendingUsers = clienteRepository.findAll().stream()
                .filter(u -> u.getEstadoRegistro() == EstadoRegistro.PENDIENTE_VALIDACION)
                .toList();

        for (Cliente usuario : pendingUsers) {
            try {
                // Generamos un token único de activación
                String token = UUID.randomUUID().toString();
                
                // Actualizamos el estado del usuario
                usuario.setActivationToken(token);
                usuario.setEstadoRegistro(EstadoRegistro.APROBADO_PENDIENTE_CLAVE);
                usuario.setCategoria("comun"); // Asignamos una categoría base

                // Intentamos mandar el mail
                emailService.sendActivationEmail(usuario.getEmail(), token);
                
                // Si el mail no tira excepción, guardamos los cambios en la DB
                clienteRepository.save(usuario);
                
                System.out.println("✅ Usuario validado asincrónicamente y correo enviado a: " + usuario.getEmail());
            } catch (Exception e) {
                System.err.println("❌ Error al enviar mail a " + usuario.getEmail() + ". Asegurate de pasar la variable de entorno MAIL_PASSWORD");
                e.printStackTrace();
            }
        }
    }
}
