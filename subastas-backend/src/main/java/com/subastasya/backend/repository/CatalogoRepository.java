package com.subastasya.backend.repository;

import com.subastasya.backend.model.Catalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CatalogoRepository extends JpaRepository<Catalogo, Long> {
    List<Catalogo> findBySubastaIdentificador(Long subastaId);
}
