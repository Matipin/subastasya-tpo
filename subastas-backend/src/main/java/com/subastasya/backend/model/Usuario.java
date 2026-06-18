package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "usuarios")
@Data
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @JsonIgnore
    private Long idUsuario;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private EstadoRegistro estadoRegistro = EstadoRegistro.PENDIENTE_VALIDACION;

    private String activationToken;
    private String recoveryToken;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "cliente_id")
    @JsonUnwrapped
    private Cliente cliente;

    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JoinColumn(name = "duenio_id")
    @JsonIgnore
    private Duenio duenio;

    @Transient
    private java.util.List<java.util.Map<String, Object>> subastasAnotadas;
}
