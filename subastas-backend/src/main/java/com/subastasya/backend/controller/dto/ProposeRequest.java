package com.subastasya.backend.controller.dto;

import lombok.Data;
import java.util.List;

@Data
public class ProposeRequest {
    private String email;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String fotoUrl;
    private List<String> fotosUrls;
    // Campos adicionales requeridos por la consigna
    private String historia; // Historia del objeto, contexto, dueños anteriores
    private String artista;  // Nombre del artista o diseñador (si aplica)
    private boolean declaraPropiedad; // Declaración de que el bien le pertenece
    private boolean aceptaDevolucion; // Acepta devolución con cargo si no es aceptado
}

