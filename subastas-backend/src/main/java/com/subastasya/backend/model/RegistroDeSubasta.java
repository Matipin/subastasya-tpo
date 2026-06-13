package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "registroDeSubasta")
@Data
public class RegistroDeSubasta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subasta", nullable = false)
    private Subasta subasta;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio", nullable = false)
    private Duenio duenio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto", nullable = false)
    private Producto producto;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente", nullable = false)
    private Cliente cliente;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal importe;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal comision;
}
