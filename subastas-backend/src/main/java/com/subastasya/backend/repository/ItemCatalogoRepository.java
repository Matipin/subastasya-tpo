package com.subastasya.backend.repository;

import com.subastasya.backend.model.ItemCatalogo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ItemCatalogoRepository extends JpaRepository<ItemCatalogo, Long> {
    List<ItemCatalogo> findByCatalogoIdentificador(Long catalogoId);
    List<ItemCatalogo> findByProductoIdentificador(Long productoId);
}
