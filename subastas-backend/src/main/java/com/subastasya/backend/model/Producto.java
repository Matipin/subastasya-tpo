package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "productos")
@Data
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    private LocalDate fecha;

    @Column(length = 2)
    private String disponible; // ('si','no')

    @Column(length = 500)
    private String descripcionCatalogo = "No Posee";

    @Column(nullable = false, length = 300)
    private String descripcionCompleta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revisor", nullable = false)
    private Empleado revisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio", nullable = false)
    private Duenio duenio;

    @Column(length = 30)
    private String seguro; // references Seguros? El script dice "seguro varchar(30) null", parece no tener FK explicita, pero la agregamos manual o la dejamos como string.
}
