package com.subastasya.backend.repository;

import com.subastasya.backend.model.Pais;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PaisRepository extends JpaRepository<Pais, Long> {
    Optional<Pais> findByNombreIgnoreCase(String nombre);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(MAX(p.identificador), 0) FROM Pais p")
    Long findMaxId();
}
