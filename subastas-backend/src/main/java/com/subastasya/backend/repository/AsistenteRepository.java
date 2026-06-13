package com.subastasya.backend.repository;

import com.subastasya.backend.model.Asistente;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AsistenteRepository extends JpaRepository<Asistente, Long> {
    java.util.List<Asistente> findByClienteIdentificador(Long id);
}
