package com.subastasya.backend.repository;

import com.subastasya.backend.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByActivationToken(String activationToken);
    Optional<Usuario> findByRecoveryToken(String recoveryToken);
    Optional<Usuario> findByCliente(com.subastasya.backend.model.Cliente cliente);
    Optional<Usuario> findByDuenio(com.subastasya.backend.model.Duenio duenio);
    Optional<Usuario> findByDuenio_Identificador(Long id);
}
