package com.subastasya.backend.controller.dto;

import lombok.Data;

@Data
public class ProposeRequest {
    private String email;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String fotoUrl;
}
