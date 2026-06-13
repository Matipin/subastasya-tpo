package com.subastasya.backend.repository;

import com.subastasya.backend.model.Deuda;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeudaRepository extends JpaRepository<Deuda, Long> {
    List<Deuda> findByUsuarioIdUsuario(Long usuarioId);
}
