package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "pujos")
@Data
public class Pujo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asistente", nullable = false)
    private Asistente asistente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "item", nullable = false)
    private ItemCatalogo item;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal importe;

    @Column(length = 2)
    private String ganador = "no";
}
