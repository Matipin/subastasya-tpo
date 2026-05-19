package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users") // Evita el uso de la palabra reservada "user" en algunas BDD
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false)
    private String nombre;

    @Column(nullable = false)
    private String apellido;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Categoria categoria;

    @Column(nullable = false)
    @Builder.Default
    private boolean registroAprobado = false;
}
