package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "catalogos")
@Data
public class Catalogo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @Column(nullable = false, length = 250)
    private String descripcion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta")
    private Subasta subasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsable", nullable = false)
    private Empleado responsable;
}
