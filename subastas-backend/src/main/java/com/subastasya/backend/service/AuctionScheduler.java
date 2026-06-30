package com.subastasya.backend.service;

import com.subastasya.backend.model.*;
import com.subastasya.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuctionScheduler {

    private final SubastaRepository subastaRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final PujoRepository pujoRepository;
    private final UsuarioRepository usuarioRepository;
    private final NotificacionRepository notificacionRepository;
    private final AsistenteRepository asistenteRepository;

    // Se ejecuta cada minuto
    @Scheduled(fixedRate = 60000)
    public void closeExpiredAuctions() {
        List<Subasta> subastas = subastaRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (Subasta s : subastas) {
            try {
                if (s.getFecha() == null || s.getHora() == null) continue;
                
                if ("abierta".equals(s.getEstado())) {
                    // Se cierra la subasta 5 minutos después de su hora de inicio (para que sea funcional y rápida)
                    if (s.getFecha().isBefore(today) || (s.getFecha().isEqual(today) && s.getHora().plusMinutes(5).isBefore(now))) {
                        s.setEstado("cerrada");
                        subastaRepository.save(s);

                    List<Catalogo> catalogos = catalogoRepository.findBySubastaIdentificador(s.getIdentificador());
                    for (Catalogo c : catalogos) {
                        List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoIdentificador(c.getIdentificador());
                        for (ItemCatalogo item : items) {
                            if (!"si".equals(item.getSubastado())) {
                                item.setSubastado("si");
                                itemCatalogoRepository.save(item);
                                
                                List<Pujo> pujos = pujoRepository.findByItemIdentificador(item.getIdentificador().longValue());
                                Pujo maxPujo = pujos.stream().max((p1, p2) -> p1.getImporte().compareTo(p2.getImporte())).orElse(null);
                                if (maxPujo != null) {
                                    maxPujo.setGanador("si");
                                    pujoRepository.save(maxPujo);
                                    
                                    // Crear notificación de ganancia
                                    if (maxPujo.getAsistente() != null && maxPujo.getAsistente().getCliente() != null) {
                                        java.util.Optional<Usuario> winnerOpt = usuarioRepository.findByCliente(maxPujo.getAsistente().getCliente());
                                        if (winnerOpt.isPresent()) {
                                            Notificacion notif = new Notificacion();
                                            notif.setUsuario(winnerOpt.get());
                                            notif.setMensaje("¡Ganaste la subasta de '" + item.getProducto().getDescripcionCatalogo() + "'! Por favor dirígete a la sección de pagos.");
                                            notif.setTipo("subasta_ganada");
                                            notif.setReferenciaId(item.getIdentificador().longValue());
                                            notif.setFechaCreacion(java.time.LocalDateTime.now());
                                            notificacionRepository.save(notif);
                                        }
                                    }
                                } else {
                                    // La subasta quedó desierta. La empresa compra el producto al precio base.
                                    if (item.getProducto() != null && item.getProducto().getDuenio() != null) {
                                        java.util.Optional<Usuario> duenioOpt = usuarioRepository.findByDuenio(item.getProducto().getDuenio());
                                        if (duenioOpt.isPresent()) {
                                            Notificacion notif = new Notificacion();
                                            notif.setUsuario(duenioOpt.get());
                                            notif.setMensaje("Tu artículo '" + item.getProducto().getDescripcionCatalogo() + "' no recibió ofertas. La empresa ha adquirido el artículo por el valor base de $" + item.getPrecioBase() + ". El pago se procesará a la brevedad.");
                                            notif.setTipo("articulo_vendido");
                                            notif.setReferenciaId(item.getIdentificador().longValue());
                                            notif.setFechaCreacion(java.time.LocalDateTime.now());
                                            notificacionRepository.save(notif);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Si faltan exactamente 5 minutos (o menos) para que comience, enviar notificación a asistentes (si no se envió ya)
                if (s.getFecha().isEqual(today) && now.isAfter(s.getHora().minusMinutes(6)) && now.isBefore(s.getHora())) {
                    List<Notificacion> enviadas = notificacionRepository.findAll().stream()
                            .filter(n -> "subasta_en_vivo".equals(n.getTipo()) && s.getIdentificador().longValue() == (n.getReferenciaId() != null ? n.getReferenciaId().longValue() : -1))
                            .toList();
                            
                    if (enviadas.isEmpty()) {
                        List<Asistente> asistentes = asistenteRepository.findAll().stream()
                                .filter(a -> a.getSubasta().getIdentificador().equals(s.getIdentificador()))
                                .toList();
                                
                        for (Asistente a : asistentes) {
                            java.util.Optional<Usuario> uOpt = usuarioRepository.findByCliente(a.getCliente());
                            if (uOpt.isPresent()) {
                                Notificacion notif = new Notificacion();
                                notif.setUsuario(uOpt.get());
                                notif.setMensaje("La subasta está a punto de comenzar (en 5 minutos o menos). ¡Prepárate para pujar!");
                                notif.setTipo("subasta_en_vivo");
                                notif.setReferenciaId(s.getIdentificador().longValue());
                                notif.setFechaCreacion(java.time.LocalDateTime.now());
                                notificacionRepository.save(notif);
                            }
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error procesando subasta ID " + s.getIdentificador() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}
