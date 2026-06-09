package com.subastasya.backend.controller.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ArticuloDTO {
    private Long id;
    private String nombre; // Descripcion del catalogo o similar
    private String urlImagen;
}
