package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "clientes")
@PrimaryKeyJoinColumn(name = "identificador")
@Data
@EqualsAndHashCode(callSuper = true)
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Cliente extends Persona {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "numeroPais")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Pais pais;

    @Column(length = 2)
    private String admitido;

    @Column(length = 10)
    private String categoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "verificador")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Empleado verificador;

    // --- CAMPOS EXTRA AÑADIDOS PARA EL LOGIN Y REGISTRO ---
    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private EstadoRegistro estadoRegistro = EstadoRegistro.PENDIENTE_VALIDACION;

    private String activationToken;
    private String recoveryToken;
    // ------------------------------------------------------
}
