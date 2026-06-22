package com.subastasya.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.subastasya.backend.dto.BidMessageDTO;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.beans.factory.annotation.Autowired;
import com.subastasya.backend.repository.*;
import com.subastasya.backend.model.*;

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
    
    @Autowired private UsuarioRepository usuarioRepository;
    @Autowired private ItemCatalogoRepository itemCatalogoRepository;
    @Autowired private AsistenteRepository asistenteRepository;
    @Autowired private PujoRepository pujoRepository;
    @Autowired private DeudaRepository deudaRepository;
    @Autowired private NotificacionRepository notificacionRepository;

    private final Map<String, BidMessageDTO> auctionStates = new ConcurrentHashMap<>();
    private final Map<String, Timer> auctionTimers = new ConcurrentHashMap<>();

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
        String stateKey = bidMessage.getAuctionId() + "_" + bidMessage.getItemId();

        BidMessageDTO currentState = auctionStates.getOrDefault(stateKey, new BidMessageDTO());
        
        if ("JOIN".equals(bidMessage.getType())) {
            if (currentState.getAmount() == null) {
                currentState.setAuctionId(bidMessage.getAuctionId());
                currentState.setItemId(bidMessage.getItemId());
                currentState.setType("STATE");
                currentState.setAmount(100.0);
                currentState.setMinBid(101.0);
                currentState.setMaxBid(120.0);
                currentState.setUser("Nadie");
                auctionStates.put(stateKey, currentState);
            }
            session.sendMessage(new TextMessage(objectMapper.writeValueAsString(currentState)));
            return;
        }

        if ("BID".equals(bidMessage.getType())) {
            if ("ENDED".equals(currentState.getType())) {
                return;
            }

            Double newMinBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.01);
            Double newMaxBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.20);
            bidMessage.setMinBid(newMinBid);
            bidMessage.setMaxBid(newMaxBid);
            bidMessage.setType("BID");
            
            try {
                if (bidMessage.getEmail() != null) {
                    java.util.Optional<Usuario> optUser = usuarioRepository.findByEmail(bidMessage.getEmail());
                    java.util.Optional<ItemCatalogo> optItem = itemCatalogoRepository.findById(bidMessage.getItemId());
                    if (optUser.isPresent() && optItem.isPresent()) {
                        Usuario user = optUser.get();
                        ItemCatalogo item = optItem.get();
                        
                        java.util.List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
                        Asistente asistente = null;
                        for (Asistente a : asistentes) {
                            if (a.getSubasta().getIdentificador().equals(item.getCatalogo().getSubasta().getIdentificador())) {
                                asistente = a;
                                break;
                            }
                        }
                        if (asistente == null) {
                            asistente = new Asistente();
                            asistente.setCliente(user.getCliente());
                            asistente.setSubasta(item.getCatalogo().getSubasta());
                            asistente.setNumeroPostor((int)(Math.random() * 10000) + 1);
                            asistente = asistenteRepository.save(asistente);
                        }

                        Pujo p = new Pujo();
                        p.setAsistente(asistente);
                        p.setItem(item);
                        p.setImporte(java.math.BigDecimal.valueOf(bidMessage.getAmount()).setScale(2, java.math.RoundingMode.HALF_UP));
                        p.setGanador("no");
                        pujoRepository.save(p);
                    }
                }
            } catch (Exception ex) {
                System.err.println("Error saving bid to DB: " + ex.getMessage());
                ex.printStackTrace();
            }

            auctionStates.put(stateKey, bidMessage);
            resetTimer(stateKey, bidMessage);
        }

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
        
        newTimer.schedule(new TimerTask() {
            @Override
            public void run() {
                try {
                    BidMessageDTO finalState = auctionStates.get(stateKey);
                    finalState.setType("ENDED");
                    auctionStates.put(stateKey, finalState);
                    
                    try {
                        if (finalState.getEmail() != null) {
                            java.util.Optional<Usuario> optUser = usuarioRepository.findByEmail(finalState.getEmail());
                            java.util.Optional<ItemCatalogo> optItem = itemCatalogoRepository.findById(finalState.getItemId());
                            
                            if (optUser.isPresent() && optItem.isPresent()) {
                                Usuario user = optUser.get();
                                ItemCatalogo item = optItem.get();
                                
                                java.util.List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
                                Asistente asistente = null;
                                for (Asistente a : asistentes) {
                                    if (a.getSubasta().getIdentificador().equals(item.getCatalogo().getSubasta().getIdentificador())) {
                                        asistente = a;
                                        break;
                                    }
                                }
                                if (asistente == null) {
                                    asistente = new Asistente();
                                    asistente.setCliente(user.getCliente());
                                    asistente.setSubasta(item.getCatalogo().getSubasta());
                                    asistente.setNumeroPostor((int)(Math.random() * 10000) + 1);
                                    asistente = asistenteRepository.save(asistente);
                                }

                                // Update the winning bid to ganador = 'si'
                                java.util.List<Pujo> pujos = pujoRepository.findByAsistenteIdentificador(asistente.getIdentificador());
                                Pujo winningPujo = null;
                                java.math.BigDecimal finalAmountBD = java.math.BigDecimal.valueOf(finalState.getAmount()).setScale(2, java.math.RoundingMode.HALF_UP);
                                
                                for (Pujo p : pujos) {
                                    if (p.getItem().getIdentificador().equals(item.getIdentificador()) && p.getImporte().compareTo(finalAmountBD) == 0) {
                                        winningPujo = p;
                                        break;
                                    }
                                }
                                if (winningPujo == null) {
                                    winningPujo = new Pujo();
                                    winningPujo.setAsistente(asistente);
                                    winningPujo.setItem(item);
                                    winningPujo.setImporte(finalAmountBD);
                                }
                                winningPujo.setGanador("si");
                                pujoRepository.save(winningPujo);

                                item.setSubastado("si");
                                itemCatalogoRepository.save(item);

                                Deuda d = new Deuda();
                                d.setUsuario(user);
                                d.setMonto(java.math.BigDecimal.valueOf(finalState.getAmount()));
                                d.setMotivo("Adjudicación Item de Subasta " + item.getIdentificador());
                                d.setPagada(false);
                                deudaRepository.save(d);

                                Notificacion notifGanador = new Notificacion();
                                notifGanador.setUsuario(user);
                                notifGanador.setMensaje("¡Felicidades! Ganaste la subasta de '" + item.getProducto().getDescripcionCatalogo() + "' por USD " + String.format("%.2f", finalState.getAmount()) + ". Dirígete a Subastas Ganadas para completar el pago.");
                                notifGanador.setTipo("subasta_ganada");
                                notifGanador.setReferenciaId(item.getIdentificador());
                                notifGanador.setFechaCreacion(java.time.LocalDateTime.now());
                                notificacionRepository.save(notifGanador);

                                if (item.getProducto().getDuenio() != null) {
                                    java.util.List<Usuario> allUsers = usuarioRepository.findAll();
                                    for (Usuario u : allUsers) {
                                        if (u.getDuenio() != null && u.getDuenio().getIdentificador().equals(item.getProducto().getDuenio().getIdentificador())) {
                                            Notificacion notifDuenio = new Notificacion();
                                            notifDuenio.setUsuario(u);
                                            notifDuenio.setMensaje("Tu producto '" + item.getProducto().getDescripcionCatalogo() + "' fue vendido en subasta por USD " + String.format("%.2f", finalState.getAmount()) + ".");
                                            notifDuenio.setTipo("producto_vendido");
                                            notifDuenio.setReferenciaId(item.getProducto().getIdentificador().longValue());
                                            notifDuenio.setFechaCreacion(java.time.LocalDateTime.now());
                                            notificacionRepository.save(notifDuenio);
                                            break;
                                        }
                                    }
                                }
                            }
                        }
                    } catch (Exception ex) {
                        System.err.println("ERROR IN AUCTION TIMER TASK: " + ex.getMessage());
                        ex.printStackTrace();
                    }

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
        }, 60000);
    }
}
