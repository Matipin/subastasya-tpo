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
        
        // Reglas de negocio básicas para pujas
        if ("BID".equals(message.getType())) {
            // Aquí iría la lógica contra la BBDD (verificar que amount > minBid y amount <= maxBid)
            // Por simplicidad para el componente live, delegamos al frontend o a un service de pujas.
            
            // Calculamos nuevos límites hipotéticos
            Double newMinBid = message.getAmount() + (message.getAmount() * 0.01);
            Double newMaxBid = message.getAmount() + (message.getAmount() * 0.20);
            
            message.setMinBid(newMinBid);
            message.setMaxBid(newMaxBid);
        }
        
        return message;
    }
}
