package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "paises")
@Data
public class Pais {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "numero")
    private Long identificador;

    @Column(nullable = false, length = 250)
    private String nombre;

    @Column(length = 250)
    private String nombreCorto;

    @Column(nullable = false, length = 250)
    private String capital;

    @Column(nullable = false, length = 250)
    private String nacionalidad;

    @Column(nullable = false, length = 150)
    private String idiomas;
}
