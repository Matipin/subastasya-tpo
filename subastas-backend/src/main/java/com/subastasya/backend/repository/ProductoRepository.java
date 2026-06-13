package com.subastasya.backend.repository;

import com.subastasya.backend.model.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {
    java.util.List<Producto> findByDuenioIdentificador(Long id);
}
