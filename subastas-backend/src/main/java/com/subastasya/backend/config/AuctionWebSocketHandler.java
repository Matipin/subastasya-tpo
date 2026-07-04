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
import org.springframework.transaction.support.TransactionTemplate;

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
    @Autowired private TransactionTemplate transactionTemplate;
    @Autowired private MedioDePagoRepository medioDePagoRepository;

    private final Map<String, BidMessageDTO> auctionStates = new ConcurrentHashMap<>();
    private final Map<String, Timer> auctionTimers = new ConcurrentHashMap<>();
    private final Map<String, String> activeUserAuctions = new ConcurrentHashMap<>();

    private int catToInt(String cat) {
        if (cat == null) return 0;
        switch (cat.toLowerCase()) {
            case "comun": return 1;
            case "especial": return 2;
            case "plata": return 3;
            case "oro": return 4;
            case "platino": return 5;
            default: return 0;
        }
    }

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
                try {
                    transactionTemplate.execute(status -> {
                        java.util.Optional<ItemCatalogo> optItem = itemCatalogoRepository.findById(bidMessage.getItemId());
                        if (optItem.isPresent()) {
                            ItemCatalogo item = optItem.get();
                            Double base = item.getPrecioBase().doubleValue();
                            currentState.setAmount(base);
                            String cat = item.getCatalogo().getSubasta().getCategoria();
                            if ("oro".equalsIgnoreCase(cat) || "platino".equalsIgnoreCase(cat)) {
                                currentState.setMinBid(base + 1.0);
                                currentState.setMaxBid(-1.0);
                            } else {
                                currentState.setMinBid(base + (base * 0.01));
                                currentState.setMaxBid(base + (base * 0.20));
                            }
                        } else {
                            currentState.setAmount(100.0);
                            currentState.setMinBid(101.0);
                            currentState.setMaxBid(120.0);
                        }
                        return null;
                    });
                } catch (Exception e) {
                    currentState.setAmount(100.0);
                    currentState.setMinBid(101.0);
                    currentState.setMaxBid(120.0);
                }
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

            // --- VALIDACIONES DE NEGOCIO ---
            if (bidMessage.getEmail() != null) {
                // Validación 1: Concurrencia (1 subasta a la vez por usuario)
                String currentActive = activeUserAuctions.get(bidMessage.getEmail());
                if (currentActive != null && !currentActive.equals(bidMessage.getAuctionId().toString())) {
                    boolean isStillActive = false;
                    for (BidMessageDTO state : auctionStates.values()) {
                        if (state.getAuctionId().toString().equals(currentActive) && !"ENDED".equals(state.getType())) {
                            isStillActive = true;
                            break;
                        }
                    }
                    if (isStillActive) {
                        bidMessage.setType("ERROR");
                        bidMessage.setContent("Ya estás participando activamente en otra subasta.");
                        session.sendMessage(new TextMessage(objectMapper.writeValueAsString(bidMessage)));
                        return;
                    }
                }
                activeUserAuctions.put(bidMessage.getEmail(), bidMessage.getAuctionId().toString());

                Boolean[] isValid = {true};
                try {
                    transactionTemplate.execute(status -> {
                        java.util.Optional<Usuario> optUser = usuarioRepository.findByEmail(bidMessage.getEmail());
                        java.util.Optional<ItemCatalogo> optItem = itemCatalogoRepository.findById(bidMessage.getItemId());
                        if (optUser.isPresent() && optItem.isPresent()) {
                            Usuario user = optUser.get();
                            ItemCatalogo item = optItem.get();

                            String subastaCat = item.getCatalogo().getSubasta().getCategoria();
                            String userCat = user.getCliente() != null ? user.getCliente().getCategoria() : "comun";
                            if (catToInt(userCat) < catToInt(subastaCat)) {
                                bidMessage.setType("ERROR");
                                bidMessage.setContent("Tu categoría (" + userCat + ") no te permite participar en subastas " + subastaCat);
                                isValid[0] = false;
                                return null;
                            }

                            java.util.List<MedioDePago> medios = medioDePagoRepository.findByCliente_Identificador(user.getCliente().getIdentificador());
                            if (medios.isEmpty()) { 
                                bidMessage.setType("ERROR");
                                bidMessage.setContent("Debes tener al menos un medio de pago para pujar.");
                                isValid[0] = false;
                                return null;
                            }

                            if (!"oro".equalsIgnoreCase(subastaCat) && !"platino".equalsIgnoreCase(subastaCat)) {
                                Double basePrice = item.getPrecioBase().doubleValue();
                                Double currentTop = currentState.getAmount() != null && currentState.getAmount() >= basePrice ? currentState.getAmount() : basePrice;
                                Double minReq = currentTop + (basePrice * 0.01);
                                Double maxReq = currentTop + (basePrice * 0.20);
                                
                                if (bidMessage.getAmount() < minReq || bidMessage.getAmount() > maxReq) {
                                    bidMessage.setType("ERROR");
                                    bidMessage.setContent(String.format("La puja debe incrementar entre $%.2f y $%.2f", minReq, maxReq));
                                    isValid[0] = false;
                                    return null;
                                }
                            }
                        }
                        return null;
                    });
                } catch (Exception e) {
                    e.printStackTrace();
                }

                if (!isValid[0]) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(bidMessage)));
                    return;
                }
            }
            // --- FIN VALIDACIONES ---

            if (Boolean.TRUE.equals(bidMessage.getSinLimite())) {
                Double newMinBid = bidMessage.getAmount() + 1.0;
                Double newMaxBid = -1.0;
                bidMessage.setMinBid(newMinBid);
                bidMessage.setMaxBid(newMaxBid);
            } else {
                Double newMinBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.01);
                Double newMaxBid = bidMessage.getAmount() + (bidMessage.getAmount() * 0.20);
                bidMessage.setMinBid(newMinBid);
                bidMessage.setMaxBid(newMaxBid);
            }
            bidMessage.setType("BID");
            
            try {
                transactionTemplate.execute(status -> {
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
                    return null;
                });
            } catch (Exception ex) {
                System.err.println("Error saving intermediate bid to DB: " + ex.getMessage());
                ex.printStackTrace();
            }

            auctionStates.put(stateKey, bidMessage);
            resetTimer(stateKey, bidMessage);
        }

        String response = objectMapper.writeValueAsString(bidMessage);
        for (WebSocketSession s : sessions) {
            if (s.isOpen()) {
                try {
                    s.sendMessage(new TextMessage(response));
                } catch (IOException e) {
                    System.err.println("Failed to send message to a session: " + e.getMessage());
                }
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
                        transactionTemplate.execute(status -> {
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

                                    // Crear deuda pendiente con SOLO el monto de la puja.
                                    // El comprador elegirá el método de envío en el Checkout,
                                    // donde se calcularán las comisiones y costos de entrega.
                                    Double pujaGanadora = finalState.getAmount();

                                    Deuda d = new Deuda();
                                    d.setUsuario(user);
                                    d.setMonto(java.math.BigDecimal.valueOf(pujaGanadora).setScale(2, java.math.RoundingMode.HALF_UP));
                                    d.setMotivo("Adjudicación Item de Subasta " + item.getIdentificador());
                                    d.setPagada(false);
                                    deudaRepository.save(d);

                                    Notificacion notifGanador = new Notificacion();
                                    notifGanador.setUsuario(user);
                                    notifGanador.setMensaje("¡Felicidades! Ganaste la subasta de '" + item.getProducto().getDescripcionCatalogo() + "' por USD " + String.format("%.2f", pujaGanadora) + ". Dirigete a 'Subastas Ganadas' para elegir el método de entrega y completar el pago.");
                                    notifGanador.setTipo("subasta_ganada");
                                    notifGanador.setReferenciaId(item.getIdentificador().longValue());
                                    notifGanador.setFechaCreacion(java.time.LocalDateTime.now());
                                    notificacionRepository.save(notifGanador);

                                    if (item.getProducto().getDuenio() != null) {
                                        java.util.List<Usuario> allUsers = usuarioRepository.findAll();
                                        for (Usuario u : allUsers) {
                                            if (u.getDuenio() != null && u.getDuenio().getIdentificador().equals(item.getProducto().getDuenio().getIdentificador())) {
                                                Double comisionVendedor = pujaGanadora * 0.15;
                                                Double pagoAlVendedor = pujaGanadora - comisionVendedor;

                                                Notificacion notifDuenio = new Notificacion();
                                                notifDuenio.setUsuario(u);
                                                notifDuenio.setMensaje("Tu producto '" + item.getProducto().getDescripcionCatalogo() + "' fue adjudicado por USD " + String.format("%.2f", pujaGanadora) + ". Tu ganancia neta estimada (descontando 15% de comisión) será de USD " + String.format("%.2f", pagoAlVendedor) + ". El pago se acreditará una vez que el comprador confirme.");
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
                            return null;
                        });
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
