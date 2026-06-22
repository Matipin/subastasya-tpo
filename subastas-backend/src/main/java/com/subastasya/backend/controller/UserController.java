package com.subastasya.backend.controller;

import com.subastasya.backend.model.*;
import com.subastasya.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UsuarioRepository usuarioRepository;
    private final MedioDePagoRepository medioDePagoRepository;
    private final DeudaRepository deudaRepository;
    private final NotificacionRepository notificacionRepository;
    private final PujoRepository pujoRepository;
    private final AsistenteRepository asistenteRepository;
    private final ProductoRepository productoRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final FotoRepository fotoRepository;
    private final SeguroRepository seguroRepository;

    @GetMapping("/me/medios-de-pago")
    public ResponseEntity<?> obtenerMediosDePago(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(medioDePagoRepository.findByCliente_Identificador(opt.get().getCliente().getIdentificador()));
    }

    @GetMapping("/me/profile")
    public ResponseEntity<?> getProfile(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();
        
        java.util.List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (user.getCliente() != null) {
            List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
            for (Asistente a : asistentes) {
                Map<String, Object> map = new HashMap<>();
                map.put("id", a.getSubasta().getIdentificador());
                
                String nombreObj = a.getSubasta().getUbicacion();
                List<Catalogo> catalogos = catalogoRepository.findBySubastaIdentificador(a.getSubasta().getIdentificador());
                if (!catalogos.isEmpty()) {
                    List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoIdentificador(catalogos.get(0).getIdentificador());
                    if (!items.isEmpty()) {
                        nombreObj = items.get(0).getProducto().getDescripcionCatalogo();
                    }
                }

                map.put("nombre", "Subasta de " + nombreObj);
                map.put("fecha", a.getSubasta().getFecha());
                map.put("hora", a.getSubasta().getHora());
                map.put("estado", a.getSubasta().getEstado());
                map.put("categoria", a.getSubasta().getCategoria());
                result.add(map);
            }
        }
        user.setSubastasAnotadas(result);
        
        return ResponseEntity.ok(user);
    }

    @GetMapping("/me/debts")
    public ResponseEntity<?> getDebts(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(deudaRepository.findByUsuarioIdUsuario(opt.get().getIdUsuario()));
    }


    @PostMapping("/me/debts/{id}/pay")
    public ResponseEntity<?> payDebt(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Optional<Deuda> deudaOpt = deudaRepository.findById(id);
        if (deudaOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Deuda deuda = deudaOpt.get();
        deuda.setPagada(true);
        deuda.setFechaPago(LocalDateTime.now());
        
        // Extraer info del checkout si viene en el body
        if (body != null) {
            if (body.containsKey("metodoEnvio")) {
                deuda.setMetodoEnvio((String) body.get("metodoEnvio"));
            }
            if (body.containsKey("renunciaSeguro")) {
                deuda.setRenunciaSeguro(Boolean.TRUE.equals(body.get("renunciaSeguro")));
            }
            if (body.containsKey("medioPagoId")) {
                // Buscar el nombre del medio de pago
                try {
                    Long mpId = Long.valueOf(body.get("medioPagoId").toString());
                    Optional<MedioDePago> mpOpt = medioDePagoRepository.findById(mpId);
                    if (mpOpt.isPresent()) {
                        MedioDePago mp = mpOpt.get();
                        deuda.setMedioPagoUsado(mp.getTipo() + " " + (mp.getEntidad() != null ? mp.getEntidad() : "") + " ****" + (mp.getNumero() != null && mp.getNumero().length() >= 4 ? mp.getNumero().substring(mp.getNumero().length() - 4) : "****"));
                    }
                } catch (Exception e) {
                    // Si falla, usar un valor genérico
                    deuda.setMedioPagoUsado("Medio de pago registrado");
                }
            }
            if (body.containsKey("medioPagoNombre")) {
                deuda.setMedioPagoUsado((String) body.get("medioPagoNombre"));
            }
        }
        
        deudaRepository.save(deuda);

        // Notificar al dueño si la deuda es por un artículo de subasta
        if (deuda.getMotivo() != null && deuda.getMotivo().contains("Subasta")) {
            try {
                String[] parts = deuda.getMotivo().split(" ");
                // El motivo suele ser "Pago por ítem de Subasta {identificador}"
                String idStr = parts[parts.length - 1];
                Long itemId = Long.valueOf(idStr);
                Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findById(itemId);
                if (itemOpt.isPresent()) {
                    ItemCatalogo item = itemOpt.get();
                    if (item.getProducto() != null && item.getProducto().getDuenio() != null) {
                        Optional<Usuario> duenioOpt = usuarioRepository.findByDuenio(item.getProducto().getDuenio());
                        if (duenioOpt.isPresent()) {
                            Notificacion notif = new Notificacion();
                            notif.setUsuario(duenioOpt.get());
                            notif.setMensaje("¡Buenas noticias! Se ha confirmado el pago de USD " + deuda.getMonto() + " por tu artículo '" + item.getProducto().getDescripcionCatalogo() + "'. El dinero ha sido transferido a tu cuenta.");
                            notif.setTipo("pago_recibido");
                            notif.setReferenciaId(itemId);
                            notif.setFechaCreacion(LocalDateTime.now());
                            notificacionRepository.save(notif);

                            // Cambiar disponibilidad a vendido
                            item.getProducto().setDisponible("vendido");
                            productoRepository.save(item.getProducto());
                        }
                    }
                }
            } catch (Exception e) {
                System.err.println("Error notificando al dueño: " + e.getMessage());
            }
        }

        return ResponseEntity.ok("Deuda pagada correctamente.");
    }

    @GetMapping("/me/notifications")
    public ResponseEntity<?> getNotifications(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(notificacionRepository.findByUsuarioIdUsuario(opt.get().getIdUsuario()));
    }

    @GetMapping("/me/metrics")
    public ResponseEntity<?> getMetrics(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();

        int totalPujas = 0;
        int subastasParticipadas = 0;
        int subastasGanadas = 0;
        int ventasRealizadas = 0;
        double totalOfertado = 0.0;
        double totalPagado = 0.0;

        if (user.getCliente() != null) {
            List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
            subastasParticipadas = asistentes.size();
            for (Asistente a : asistentes) {
                List<Pujo> pujos = pujoRepository.findByAsistenteIdentificador(a.getIdentificador());
                totalPujas += pujos.size();
                for (Pujo p : pujos) {
                    totalOfertado += p.getImporte().doubleValue();
                    if ("si".equals(p.getGanador())) {
                        subastasGanadas++;
                    }
                }
            }
        }
        
        if (user.getDuenio() != null) {
            ventasRealizadas = productoRepository.findByDuenioIdentificador(user.getDuenio().getIdentificador()).size();
        }

        // Calcular total pagado de deudas
        List<Deuda> deudas = deudaRepository.findByUsuarioIdUsuario(user.getIdUsuario());
        for (Deuda d : deudas) {
            if (d.isPagada()) {
                totalPagado += d.getMonto().doubleValue();
            }
        }

        Map<String, Object> metrics = new HashMap<>();
        metrics.put("totalPujas", totalPujas);
        metrics.put("subastasParticipadas", subastasParticipadas);
        metrics.put("subastasGanadas", subastasGanadas);
        metrics.put("ventasRealizadas", ventasRealizadas);
        metrics.put("totalOfertado", totalOfertado);
        metrics.put("totalPagado", totalPagado);

        return ResponseEntity.ok(metrics);
    }

    @GetMapping("/me/items/won")
    public ResponseEntity<?> getWonAuctions(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (user.getCliente() != null) {
            List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
            for (Asistente a : asistentes) {
                List<Pujo> pujos = pujoRepository.findByAsistenteIdentificador(a.getIdentificador());
                for (Pujo p : pujos) {
                    if ("si".equals(p.getGanador())) {
                        Map<String, Object> map = new HashMap<>();
                        map.put("id", p.getIdentificador());
                        map.put("monto", p.getImporte());
                        map.put("itemNombre", p.getItem().getProducto().getDescripcionCatalogo());
                        map.put("fecha", p.getItem().getCatalogo().getSubasta().getFecha());
                        map.put("subastaId", p.getItem().getCatalogo().getSubasta().getIdentificador());
                        
                        // Comisión (10% del monto)
                        double comision = p.getImporte().doubleValue() * 0.10;
                        map.put("comision", comision);
                        
                        // Imagen del producto
                        List<Foto> fotos = fotoRepository.findByProductoIdentificador(p.getItem().getProducto().getIdentificador());
                        if (!fotos.isEmpty() && fotos.get(0).getFoto() != null) {
                            map.put("urlImagen", new String(fotos.get(0).getFoto(), java.nio.charset.StandardCharsets.UTF_8));
                        }
                        
                        // Nombre de la subasta
                        List<Catalogo> catalogos = catalogoRepository.findBySubastaIdentificador(
                            p.getItem().getCatalogo().getSubasta().getIdentificador());
                        if (!catalogos.isEmpty()) {
                            map.put("subastaNombre", catalogos.get(0).getDescripcion());
                        }

                        List<Deuda> deudas = deudaRepository.findByUsuarioIdUsuario(user.getIdUsuario());
                        boolean isPaid = deudas.stream().anyMatch(d -> d.getMotivo().contains("Subasta " + p.getItem().getIdentificador()) && d.isPagada());
                        if (isPaid) {
                            map.put("estado_pago", "pagado");
                        } else {
                            // Check if debt exists but unpaid
                            boolean hasPendingDebt = deudas.stream().anyMatch(d -> d.getMotivo().contains("Subasta " + p.getItem().getIdentificador()) && !d.isPagada());
                            map.put("estado_pago", hasPendingDebt ? "pendiente" : "pendiente");
                        }
                        
                        // Info de pago para ítems ya pagados
                        Optional<Deuda> relatedDebt = deudas.stream()
                            .filter(d -> d.getMotivo().contains("Subasta " + p.getItem().getIdentificador()))
                            .findFirst();
                        if (relatedDebt.isPresent()) {
                            Deuda deuda = relatedDebt.get();
                            map.put("deudaId", deuda.getId());
                            if (deuda.isPagada()) {
                                map.put("medioPagoUsado", deuda.getMedioPagoUsado() != null ? deuda.getMedioPagoUsado() : "Medio de pago registrado");
                                map.put("fechaPago", deuda.getFechaPago());
                                map.put("metodoEnvio", deuda.getMetodoEnvio() != null ? deuda.getMetodoEnvio() : "domicilio");
                                map.put("renunciaSeguro", deuda.isRenunciaSeguro());
                                map.put("recibido", true); // Para ítems pagados, asumimos recibido
                            }
                        }

                        result.add(map);
                    }
                }
            }
        }
        return ResponseEntity.ok(result);
    }



    @GetMapping("/me/items/proposed")
    public ResponseEntity<?> getProducts(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();
        if (user.getDuenio() == null) return ResponseEntity.ok(new java.util.ArrayList<>());
        
        List<Producto> products = productoRepository.findByDuenioIdentificador(user.getDuenio().getIdentificador());
        List<java.util.Map<String, Object>> result = new java.util.ArrayList<>();
        for (Producto p : products) {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("identificador", p.getIdentificador());
            map.put("descripcionCatalogo", p.getDescripcionCatalogo());
            map.put("descripcionCompleta", p.getDescripcionCompleta());
            map.put("fecha", p.getFecha());
            map.put("disponible", p.getDisponible());
            
            // Ubicación y Seguro
            map.put("ubicacion", "Depósito Central - Rivadavia 3421");
            if (p.getSeguro() != null) {
                java.util.Optional<Seguro> optS = seguroRepository.findByNroPoliza(p.getSeguro());
                if (optS.isPresent()) {
                    Seguro s = optS.get();
                    map.put("nroPoliza", s.getNroPoliza());
                    map.put("companiaSeguro", s.getCompania());
                    map.put("montoAsegurado", s.getImporte());
                }
            }
            
            // Imagen del producto
            List<Foto> fotos = fotoRepository.findByProductoIdentificador(p.getIdentificador());
            if (!fotos.isEmpty() && fotos.get(0).getFoto() != null) {
                map.put("urlImagen", new String(fotos.get(0).getFoto(), java.nio.charset.StandardCharsets.UTF_8));
            }

            // Información de venta (reutilizada para evitar endpoints nuevos)
            List<ItemCatalogo> items = itemCatalogoRepository.findByProductoIdentificador(p.getIdentificador());
            for (ItemCatalogo ic : items) {
                List<Pujo> pujos = pujoRepository.findByItemIdentificador(ic.getIdentificador());
                Pujo ganador = pujos.stream().filter(pj -> "si".equals(pj.getGanador())).findFirst().orElse(null);
                
                if (ganador != null) {
                    double montoVenta = ganador.getImporte().doubleValue();
                    double comisionEmpresa = ic.getComision() != null ? ic.getComision().doubleValue() : (montoVenta * 0.15); 
                    double pagoAlDuenio = montoVenta - comisionEmpresa;
                    
                    map.put("isVendido", true);
                    map.put("montoVenta", montoVenta);
                    map.put("comisionEmpresa", comisionEmpresa);
                    map.put("pagoAlDuenio", pagoAlDuenio);
                    
                    List<Deuda> deudasComprador = deudaRepository.findByMotivoContaining("Subasta " + ic.getIdentificador());
                    boolean pagado = deudasComprador.stream().anyMatch(d -> d.isPagada());
                    map.put("pagadoPorComprador", pagado);
                    
                    if (ic.getCatalogo() != null && ic.getCatalogo().getSubasta() != null) {
                        map.put("fechaVenta", ic.getCatalogo().getSubasta().getFecha());
                    } else {
                        map.put("fechaVenta", "Desconocida");
                    }
                }
            }
            
            result.add(map);
        }
        return ResponseEntity.ok(result);
    }

    @GetMapping("/me/bids")
    public ResponseEntity<?> getBids(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        Usuario user = opt.get();
        List<Map<String, Object>> result = new java.util.ArrayList<>();
        if (user.getCliente() != null) {
            List<Asistente> asistentes = asistenteRepository.findByClienteIdentificador(user.getCliente().getIdentificador());
            for (Asistente a : asistentes) {
                List<Pujo> pujos = pujoRepository.findByAsistenteIdentificador(a.getIdentificador());
                for (Pujo p : pujos) {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getIdentificador().toString());
                    map.put("articulo", p.getItem().getProducto().getDescripcionCatalogo());
                    map.put("subasta", p.getItem().getCatalogo().getDescripcion());
                    map.put("monto", p.getImporte());
                    map.put("fecha", p.getItem().getCatalogo().getSubasta().getFecha());
                    result.add(map);
                }
            }
        }
        return ResponseEntity.ok(result);
    }

}
