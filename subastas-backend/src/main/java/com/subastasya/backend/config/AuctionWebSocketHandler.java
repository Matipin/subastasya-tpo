package com.subastasya.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subastasya.backend.dto.BidMessageDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.io.IOException;
import java.util.Collections;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class AuctionWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
        BidMessageDTO bidMessage = objectMapper.readValue(payload, BidMessageDTO.class);

        // Process message (Chat or Bid)
        if ("BID".equals(bidMessage.getType())) {
            Double newMinBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.01);
            Double newMaxBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.20);
            bidMessage.setMinBid(newMinBid);
            bidMessage.setMaxBid(newMaxBid);
        }

        // Broadcast to all connected clients
        String response = objectMapper.writeValueAsString(bidMessage);
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(new TextMessage(response));
            }
        }
    }
}
