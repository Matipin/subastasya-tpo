package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "personas")
@Inheritance(strategy = InheritanceType.JOINED)
@Data
public abstract class Persona {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @Column(nullable = false, length = 20)
    private String documento;

    @Column(nullable = false, length = 150)
    private String nombre;

    @Column(length = 250)
    private String direccion;

    @Column(length = 15)
    private String estado;

    @Column(columnDefinition="BYTEA")
    private byte[] foto;
}
