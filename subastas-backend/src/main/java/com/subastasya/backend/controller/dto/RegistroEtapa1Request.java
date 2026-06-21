package com.subastasya.backend.controller.dto;

import lombok.Data;

@Data
public class RegistroEtapa1Request {
    private String email;
    private String nombre;
    private String apellido;
    private String telefono;
    private String domicilio;
    private String pais;
    private String urlFotoDniFront;
    private String urlFotoDniBack;
    private Boolean isUpdate;
}
