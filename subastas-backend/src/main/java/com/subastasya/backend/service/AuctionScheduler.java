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

    // Se ejecuta cada minuto
    @Scheduled(fixedRate = 60000)
    public void closeExpiredAuctions() {
        List<Subasta> subastas = subastaRepository.findAll();
        LocalDate today = LocalDate.now();
        LocalTime now = LocalTime.now();

        for (Subasta s : subastas) {
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
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
