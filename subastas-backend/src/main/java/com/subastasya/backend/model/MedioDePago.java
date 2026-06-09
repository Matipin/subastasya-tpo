package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Table(name = "mediosDePago")
@Data
public class MedioDePago {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long identificador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Cliente cliente;

    // TARJETA_CREDITO, CUENTA_BANCARIA, CHEQUE
    @Column(nullable = false, length = 50)
    private String tipo;

    // VISA, Banco Galicia, etc.
    @Column(length = 100)
    private String entidad;

    // Ultimos 4 nros o CBU
    @Column(nullable = false, length = 50)
    private String numero;

    // Titular de la tarjeta o cuenta
    @Column(length = 150)
    private String titular;

    // Verificado por la empresa (TPO requiere verificación)
    @Column(nullable = false)
    private boolean verificado = false;

    // Si es un cheque, el monto del mismo, o fondos reservados en la cuenta
    @Column(precision = 18, scale = 2)
    private BigDecimal montoGarantia;
}
