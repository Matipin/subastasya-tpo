package com.subastasya.backend.repository;

import com.subastasya.backend.model.Seguro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SeguroRepository extends JpaRepository<Seguro, String> {
    Optional<Seguro> findByNroPoliza(String nroPoliza);
}
