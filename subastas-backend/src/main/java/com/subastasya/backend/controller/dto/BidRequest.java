package com.subastasya.backend.controller.dto;

import lombok.Data;

@Data
public class BidRequest {
    private Double amount;
    private Integer payment_method_id;
    private Integer asistenteId; // Added for internal mapping since auth is simple
}
