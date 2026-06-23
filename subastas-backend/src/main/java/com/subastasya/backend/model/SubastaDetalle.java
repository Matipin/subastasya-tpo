package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "subastas_detalles")
@Data
public class SubastaDetalle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Relación 1 a 1 con Subasta sin tocar la tabla subastas original
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta_identificador", nullable = false, unique = true)
    private Subasta subasta;

    // Moneda de la subasta (ej: "pesos" o "dolares")
    @Column(nullable = false, length = 15)
    private String moneda = "pesos";

    // Costo base de envío asociado a todos los items de esta subasta
    @Column(precision = 18, scale = 2)
    private BigDecimal costoEnvioBase = BigDecimal.valueOf(50.00);
}
