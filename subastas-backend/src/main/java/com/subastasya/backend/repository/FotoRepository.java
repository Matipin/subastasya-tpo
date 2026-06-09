package com.subastasya.backend.repository;

import com.subastasya.backend.model.Foto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FotoRepository extends JpaRepository<Foto, Long> {
    List<Foto> findByProductoIdentificador(Long productoId);
}
