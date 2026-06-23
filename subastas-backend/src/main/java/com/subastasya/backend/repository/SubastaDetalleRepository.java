package com.subastasya.backend.repository;

import com.subastasya.backend.model.SubastaDetalle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubastaDetalleRepository extends JpaRepository<SubastaDetalle, Long> {
    Optional<SubastaDetalle> findBySubastaIdentificador(Long subastaIdentificador);
}
