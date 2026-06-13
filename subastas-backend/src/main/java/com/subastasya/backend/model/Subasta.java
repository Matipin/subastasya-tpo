package com.subastasya.backend.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Data
@Entity
@Table(name = "subastas")
public class Subasta {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "identificador")
    private Long identificador;
    
    @Transient
    private String nombre;

    @JsonProperty("fechaInicio")
    @Column(nullable = false)
    private LocalDate fecha; // constraint chkFecha check (fecha > dateAdd(dd, 10, getdate()))
    
    @Column(nullable = false)
    private LocalTime hora;
    
    @Column(length = 10)
    private String estado; // constraint chkES check (estado in ('abierta','carrada'))
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subastador")
    private Subastador subastador;
    
    @Column(length = 350)
    private String ubicacion;
    
    private Integer capacidadAsistentes;
    
    @Column(length = 2)
    private String tieneDeposito; // ('si','no')
    
    @Column(length = 2)
    private String seguridadPropia; // ('si','no')
    
    @Column(length = 10)
    private String categoria; // ('comun', 'especial', 'plata', 'oro', 'platino')
    
    @Transient
    private List<com.subastasya.backend.controller.dto.ArticuloDTO> articulos;
}
