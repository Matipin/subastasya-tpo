package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "itemsCatalogo")
@Data
public class ItemCatalogo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "catalogo", nullable = false)
    private Catalogo catalogo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "producto", nullable = false)
    private Producto producto;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal precioBase;

    @Column(nullable = false, precision = 18, scale = 2)
    private BigDecimal comision;

    @Column(length = 2)
    private String subastado; // ('si','no')
}
