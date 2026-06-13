package com.subastasya.backend.repository;

import com.subastasya.backend.model.Pujo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PujoRepository extends JpaRepository<Pujo, Long> {
    List<Pujo> findByItemIdentificador(Long id);
    List<Pujo> findByAsistenteIdentificador(Long id);
}
