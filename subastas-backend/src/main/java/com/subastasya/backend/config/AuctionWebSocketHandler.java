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
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.Timer;
import java.util.TimerTask;

@Component
public class AuctionWebSocketHandler extends TextWebSocketHandler {

    private final Set<WebSocketSession> sessions = Collections.newSetFromMap(new ConcurrentHashMap<>());
    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Almacena el estado en vivo de cada item: key = "auctionId_itemId"
    private final Map<String, BidMessageDTO> auctionStates = new ConcurrentHashMap<>();
    private final Map<String, Timer> auctionTimers = new ConcurrentHashMap<>();

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        sessions.add(session);
        // Cuando alguien se conecta, si hay estado guardado, podríamos mandarle el último estado de todas las subastas o que él mande un JOIN
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        sessions.remove(session);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws IOException {
        String payload = message.getPayload();
        BidMessageDTO bidMessage = objectMapper.readValue(payload, BidMessageDTO.class);
        String stateKey = bidMessage.getAuctionId() + "_" + bidMessage.getItemId();

        BidMessageDTO currentState = auctionStates.getOrDefault(stateKey, new BidMessageDTO());
        
        if ("JOIN".equals(bidMessage.getType())) {
            // El cliente pide el estado actual
            if (currentState.getAmount() == null) {
                // Initialize default state
                currentState.setAuctionId(bidMessage.getAuctionId());
                currentState.setItemId(bidMessage.getItemId());
                currentState.setType("STATE");
                currentState.setAmount(100.0); // Debería venir de la base de datos idealmente
                currentState.setMinBid(101.0);
                currentState.setMaxBid(120.0);
                currentState.setUser("Nadie");
                auctionStates.put(stateKey, currentState);
            }
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(currentState)));
            return;
        }

        if ("BID".equals(bidMessage.getType())) {
            // Validar que el tiempo no haya terminado
            if ("ENDED".equals(currentState.getType())) {
                return; // Ignorar pujas si ya terminó
            }

            Double newMinBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.01);
            Double newMaxBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.20);
            bidMessage.setMinBid(newMinBid);
            bidMessage.setMaxBid(newMaxBid);
            bidMessage.setType("BID");
            
            auctionStates.put(stateKey, bidMessage);
            resetTimer(stateKey, bidMessage);
        }

        // Broadcast to all connected clients
        String response = objectMapper.writeValueAsString(bidMessage);
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                s.sendMessage(new TextMessage(response));
            }
        }
    }

    private void resetTimer(String stateKey, BidMessageDTO bidMessage) {
        Timer existingTimer = auctionTimers.get(stateKey);
        if (existingTimer != null) {
            existingTimer.cancel();
        }

        Timer newTimer = new Timer();
        auctionTimers.put(stateKey, newTimer);
        
        // 30 seconds for the timer as an example
        newTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                try {
                    BidMessageDTO finalState = auctionStates.get(stateKey);
                    finalState.setType("ENDED");
                    auctionStates.put(stateKey, finalState);
                    
                    String response = objectMapper.writeValueAsString(finalState);
                    for (WebSocketSession s : sessions) {
                        if (s.isOpen()) {
                            s.sendMessage(new TextMessage(response));
                        }
                    }
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }, 30000); // 30 segundos
    }
}
