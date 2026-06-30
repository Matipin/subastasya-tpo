package com.subastasya.backend.controller;

import com.subastasya.backend.dto.BidMessageDTO;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class WebSocketAuctionController {

    @MessageMapping("/auction/{auctionId}/item/{itemId}")
    @SendTo("/topic/auction/{auctionId}/item/{itemId}")
    public BidMessageDTO handleBidOrChat(@DestinationVariable Long auctionId, 
                                         @DestinationVariable Long itemId, 
                                         @Payload BidMessageDTO message) {
        
        // Reglas de negocio para pujas en tiempo real
        if ("BID".equals(message.getType())) {
            Double amount = message.getAmount();
            if (amount == null || amount <= 0) {
                message.setType("ERROR");
                message.setContent("Monto de puja inválido.");
                return message;
            }
            
            // Validar contra minBid enviado (si el frontend lo manda)
            if (message.getMinBid() != null && amount < message.getMinBid()) {
                message.setType("ERROR");
                message.setContent("La puja debe ser al menos USD " + String.format("%.2f", message.getMinBid()));
                return message;
            }
            
            // Calcular nuevos límites sobre el monto ACTUAL pujado
            // Oro/platino (sinLimite=true): mínima = amount + $1, sin máximo (-1)
            // Comun: mínima = amount + 1%, máxima = amount + 20%
            boolean esSinLimite = Boolean.TRUE.equals(message.getSinLimite());
            Double newMinBid = esSinLimite ? amount + 1.0 : amount + (amount * 0.01);
            Double newMaxBid = esSinLimite ? -1.0 : amount + (amount * 0.20);
            
            message.setMinBid(newMinBid);
            message.setMaxBid(newMaxBid);
        }
        
        return message;
    }
}
