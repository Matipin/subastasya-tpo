package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "asistentes")
@Data
public class Asistente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @Column(nullable = false)
    private Integer numeroPostor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta", nullable = false)
    private Subasta subasta;
}
