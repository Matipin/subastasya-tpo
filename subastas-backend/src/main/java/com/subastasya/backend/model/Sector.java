package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "sectores")
@Data
public class Sector {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @Column(nullable = false, length = 150)
    private String nombreSector;

    @Column(length = 10)
    private String codigoSector;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsableSector")
    private Empleado responsableSector;
}
