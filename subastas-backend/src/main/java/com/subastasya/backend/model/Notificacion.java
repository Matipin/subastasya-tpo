package com.subastasya.backend.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "notificaciones")
@Data
public class Notificacion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 500)
    private String mensaje;

    // Tipo de notificación para navegación en el frontend
    // Valores: "subasta_ganada", "subasta_en_vivo", "producto_tasado", "producto_vendido", "deuda", "general"
    @Column(length = 50)
    private String tipo = "general";

    // ID de referencia para navegación (ej: itemId, subastaId, productoId)
    private Long referenciaId;

    private boolean leida = false;
    private LocalDateTime fechaCreacion = LocalDateTime.now();
}
