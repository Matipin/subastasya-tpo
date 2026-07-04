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
@org.springframework.transaction.annotation.Transactional
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

    /**
     * Nuevo endpoint dedicado para actualizar perfil (nombre y dirección).
     * Reemplaza el workaround de usar /auth/registro con isUpdate:true.
     */
    @PutMapping("/me/profile")
    public ResponseEntity<?> updateProfile(@RequestParam String email, @RequestBody Map<String, Object> body) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        
        Usuario user = opt.get();
        Cliente cliente = user.getCliente();
        if (cliente == null) return ResponseEntity.badRequest().body("El usuario no tiene perfil de cliente.");

        if (body.containsKey("nombre") && body.get("nombre") != null) {
            String nombre = body.get("nombre").toString().trim();
            if (!nombre.isEmpty()) {
                // Si viene apellido separado, concatenar
                if (body.containsKey("apellido") && body.get("apellido") != null) {
                    nombre = nombre + " " + body.get("apellido").toString().trim();
                }
                cliente.setNombre(nombre);
            }
        }
        if (body.containsKey("domicilio") && body.get("domicilio") != null) {
            String domicilio = body.get("domicilio").toString().trim();
            if (!domicilio.isEmpty()) {
                cliente.setDireccion(domicilio);
            }
        }
        
        clienteRepository.save(cliente);
        return ResponseEntity.ok("Perfil actualizado correctamente.");
    }

    private final com.subastasya.backend.repository.ClienteRepository clienteRepository;

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
        
        // Extraer info del checkout si viene en el body
        String metodoEnvio = "domicilio";
        boolean renunciaSeguro = false;
        Long medioPagoId = null;
        
        if (body != null) {
            if (body.containsKey("metodoEnvio")) {
                metodoEnvio = (String) body.get("metodoEnvio");
            }
            if (body.containsKey("renunciaSeguro")) {
                renunciaSeguro = Boolean.TRUE.equals(body.get("renunciaSeguro"));
            }
            if (body.containsKey("medioPagoId")) {
                try {
                    medioPagoId = Long.valueOf(body.get("medioPagoId").toString());
                } catch (Exception e) { /* ignorar */ }
            }
        }

        // VALIDACIÓN Y COBRO DEL MEDIO DE PAGO
        if (medioPagoId != null) {
            Optional<MedioDePago> mpOpt = medioDePagoRepository.findById(medioPagoId);
            if (mpOpt.isPresent()) {
                MedioDePago mp = mpOpt.get();
                BigDecimal saldoDisponible = mp.getMontoGarantia() != null ? mp.getMontoGarantia() : BigDecimal.ZERO;
                BigDecimal montoPujo = deuda.getMonto();
                BigDecimal montoACobrar = montoPujo;
                
                if (deuda.getMotivo() != null && deuda.getMotivo().contains("Adjudicación Item de Subasta")) {
                    BigDecimal comision = montoPujo.multiply(new BigDecimal("0.10")).setScale(2, java.math.RoundingMode.HALF_UP);
                    BigDecimal envio = "domicilio".equals(metodoEnvio) ? new BigDecimal("50.00") : BigDecimal.ZERO;
                    montoACobrar = montoPujo.add(comision).add(envio);
                }

                if (saldoDisponible.compareTo(montoACobrar) < 0) {
                    // Generar multa del 10% automáticamente y suspender cuenta
                    generarMultaYSuspenderCuenta(deuda);
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                            .body("Transacción rechazada: Fondos insuficientes. Saldo disponible: USD " +
                                  String.format("%.2f", saldoDisponible) +
                                  " — Monto requerido: USD " + String.format("%.2f", montoACobrar) +
                                  ". Se ha generado una multa del 10% y tu cuenta ha sido suspendida temporalmente. Tienes 72 horas para regularizar tu situación.");
                }

                // Descontar del comprador
                mp.setMontoGarantia(saldoDisponible.subtract(montoACobrar));
                medioDePagoRepository.save(mp);

                String ultimosCuatro = (mp.getNumero() != null && mp.getNumero().length() >= 4)
                    ? mp.getNumero().substring(mp.getNumero().length() - 4) : "****";
                deuda.setMedioPagoUsado(mp.getTipo() + " " + (mp.getEntidad() != null ? mp.getEntidad() : "") + " ****" + ultimosCuatro);

                // FLUJO REAL: Comprador → SubastasYa → Dueño
                procesarPagoViaSubastasYa(deuda, montoACobrar);
            } else if (body != null && body.containsKey("medioPagoNombre")) {
                deuda.setMedioPagoUsado((String) body.get("medioPagoNombre"));
            }
        } else if (body != null && body.containsKey("medioPagoNombre")) {
            deuda.setMedioPagoUsado((String) body.get("medioPagoNombre"));
        }

        deuda.setPagada(true);
        deuda.setFechaPago(LocalDateTime.now());
        deuda.setMetodoEnvio(metodoEnvio);
        deuda.setRenunciaSeguro(renunciaSeguro);
        deudaRepository.save(deuda);

        return ResponseEntity.ok("Deuda pagada correctamente.");
    }

    /**
     * Procesa el flujo real de pago:
     * 1. Suma el monto recibido a la cuenta de SubastasYa.
     * 2. SubastasYa descuenta su comisión (15%) y acredita al dueño.
     * 3. Notifica al dueño con el monto real.
     */
    private void procesarPagoViaSubastasYa(Deuda deuda, BigDecimal montoRecibido) {
        try {
            // 1. Sumar a la cuenta de SubastasYa
            Optional<Usuario> empresaOpt = usuarioRepository.findByEmail("subastasya@admin.com");
            MedioDePago cuentaEmpresa = null;
            if (empresaOpt.isPresent()) {
                List<MedioDePago> mpEmpresa = medioDePagoRepository.findByCliente_Identificador(
                    empresaOpt.get().getCliente().getIdentificador());
                if (!mpEmpresa.isEmpty()) {
                    cuentaEmpresa = mpEmpresa.get(0);
                    BigDecimal saldoActual = cuentaEmpresa.getMontoGarantia() != null
                        ? cuentaEmpresa.getMontoGarantia() : BigDecimal.ZERO;
                    cuentaEmpresa.setMontoGarantia(saldoActual.add(montoRecibido));
                    medioDePagoRepository.save(cuentaEmpresa);
                }
            }

            // 2. Encontrar el ítem y dueño a partir del motivo de la deuda
            if (deuda.getMotivo() != null && deuda.getMotivo().contains("Subasta")) {
                // Extraer ID del ítem del motivo (formato: "Adjudicación Item de Subasta {itemId}")
                String[] parts = deuda.getMotivo().split(" ");
                String idStr = parts[parts.length - 1].replaceAll("[^0-9]", "");
                if (idStr.isEmpty()) return;
                
                Long itemId = Long.valueOf(idStr);
                Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findById(itemId);
                if (itemOpt.isEmpty()) return;
                
                ItemCatalogo item = itemOpt.get();
                if (item.getProducto() == null || item.getProducto().getDuenio() == null) return;

                // Calcular comisión y pago al dueño
                // El montoRecibido ya incluye comisión del comprador (10%). 
                // El precio de venta puro es lo que pagó el ganador en la puja (excluimos comisión comprador y envío).
                // Buscamos la puja ganadora para obtener el precio real.
                List<Pujo> pujos = pujoRepository.findByItemIdentificador(itemId);
                Pujo pujoGanador = pujos.stream()
                    .filter(p -> "si".equals(p.getGanador()))
                    .findFirst().orElse(null);
                
                BigDecimal precioVenta = pujoGanador != null ? pujoGanador.getImporte() : montoRecibido;
                BigDecimal comisionEmpresa = precioVenta.multiply(new BigDecimal("0.15")).setScale(2, java.math.RoundingMode.HALF_UP);
                BigDecimal pagoAlDuenio = precioVenta.subtract(comisionEmpresa).setScale(2, java.math.RoundingMode.HALF_UP);

                // 3. Acreditar al dueño
                Optional<Usuario> duenioUsuarioOpt = usuarioRepository.findByDuenio(item.getProducto().getDuenio());
                if (duenioUsuarioOpt.isPresent()) {
                    Usuario duenioUsuario = duenioUsuarioOpt.get();
                    
                    // Buscar medio de pago del dueño para acreditarle
                    if (duenioUsuario.getCliente() != null) {
                        List<MedioDePago> mpDuenio = medioDePagoRepository.findByCliente_Identificador(
                            duenioUsuario.getCliente().getIdentificador());
                        if (!mpDuenio.isEmpty()) {
                            MedioDePago cuentaDuenio = mpDuenio.get(0);
                            BigDecimal saldoDuenio = cuentaDuenio.getMontoGarantia() != null
                                ? cuentaDuenio.getMontoGarantia() : BigDecimal.ZERO;
                            cuentaDuenio.setMontoGarantia(saldoDuenio.add(pagoAlDuenio));
                            medioDePagoRepository.save(cuentaDuenio);

                            // Descontar de SubastasYa el pago al dueño
                            if (cuentaEmpresa != null) {
                                BigDecimal saldoEmpresa = cuentaEmpresa.getMontoGarantia();
                                cuentaEmpresa.setMontoGarantia(saldoEmpresa.subtract(pagoAlDuenio));
                                medioDePagoRepository.save(cuentaEmpresa);
                            }
                        }
                    }

                    // Notificar al dueño con montos reales
                    Notificacion notif = new Notificacion();
                    notif.setUsuario(duenioUsuario);
                    notif.setMensaje("¡Pago confirmado! Tu artículo '" + item.getProducto().getDescripcionCatalogo() +
                        "' fue vendido por USD " + String.format("%.2f", precioVenta) +
                        ". Comisión SubastasYa (15%): USD " + String.format("%.2f", comisionEmpresa) +
                        ". Monto acreditado en tu cuenta: USD " + String.format("%.2f", pagoAlDuenio) + ".");
                    notif.setTipo("pago_recibido");
                    notif.setReferenciaId(itemId);
                    notif.setFechaCreacion(LocalDateTime.now());
                    notificacionRepository.save(notif);

                    // Marcar producto como vendido ("no" disponible)
                    item.getProducto().setDisponible("no");
                    productoRepository.save(item.getProducto());
                }
            }
        } catch (Exception e) {
            System.err.println("Error en flujo de pago vía SubastasYa: " + e.getMessage());
            e.printStackTrace();
        }
    }

    @GetMapping("/me/notifications")
    public ResponseEntity<?> getNotifications(@RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        return ResponseEntity.ok(notificacionRepository.findByUsuarioIdUsuario(opt.get().getIdUsuario()));
    }

    /**
     * Nuevo endpoint para eliminar una notificación del backend.
     * Esto soluciona que las notificaciones "eliminadas" volvieran al limpiar el caché.
     */
    @DeleteMapping("/me/notifications/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable Long id, @RequestParam String email) {
        Optional<Usuario> opt = usuarioRepository.findByEmail(email);
        if (opt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Usuario no encontrado.");
        
        Optional<Notificacion> notifOpt = notificacionRepository.findById(id);
        if (notifOpt.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Notificación no encontrada.");
        
        // Verificar que la notificación pertenece al usuario
        Notificacion notif = notifOpt.get();
        if (!notif.getUsuario().getIdUsuario().equals(opt.get().getIdUsuario())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No autorizado.");
        }
        
        notificacionRepository.delete(notif);
        return ResponseEntity.ok("Notificación eliminada.");
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
        if (user.getCliente() != null) {
            metrics.put("categoria", user.getCliente().getCategoria());
        }

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
                        map.put("monto", p.getImporte().doubleValue());
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
                        Optional<Deuda> relatedDebt = deudas.stream()
                            .filter(d -> d.getMotivo() != null && d.getMotivo().contains("Subasta " + p.getItem().getIdentificador()))
                            .findFirst();
                        
                        if (relatedDebt.isPresent()) {
                            Deuda deuda = relatedDebt.get();
                            map.put("deudaId", deuda.getId());
                            map.put("estado_pago", deuda.isPagada() ? "pagado" : "pendiente");
                            if (deuda.isPagada()) {
                                map.put("medioPagoUsado", deuda.getMedioPagoUsado() != null ? deuda.getMedioPagoUsado() : "Medio de pago registrado");
                                map.put("fechaPago", deuda.getFechaPago());
                                map.put("metodoEnvio", deuda.getMetodoEnvio() != null ? deuda.getMetodoEnvio() : "domicilio");
                                map.put("renunciaSeguro", deuda.isRenunciaSeguro());
                                map.put("recibido", true);
                            }
                        } else {
                            map.put("estado_pago", "pendiente");
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

            // Información de venta
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

    /**
     * Historial completo de pujas del usuario.
     * Incluye todas las pujas realizadas (ganes o pierdas), con estado ganador y monto formateado.
     */
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
                    map.put("id", p.getIdentificador() != null ? p.getIdentificador().toString() : java.util.UUID.randomUUID().toString());
                    map.put("articulo", p.getItem().getProducto().getDescripcionCatalogo());
                    map.put("subasta", p.getItem().getCatalogo().getDescripcion());
                    // Usar doubleValue() para asegurar serialización numérica limpia
                    map.put("monto", p.getImporte().doubleValue());
                    map.put("fecha", p.getItem().getCatalogo().getSubasta().getFecha());
                    // Estado ganador: true/false en lugar de "si"/"no" para el frontend
                    map.put("ganador", "si".equals(p.getGanador()));
                    map.put("subastaId", p.getItem().getCatalogo().getSubasta().getIdentificador());
                    map.put("itemId", p.getItem().getIdentificador());
                    result.add(map);
                }
            }
            // Ordenar por monto descendente para mostrar las pujas más importantes primero
            result.sort((a2, b2) -> Double.compare(((Number) b2.get("monto")).doubleValue(), ((Number) a2.get("monto")).doubleValue()));
        }
        return ResponseEntity.ok(result);
    }

    /**
     * Genera una multa del 10% sobre el monto de la deuda y suspende la cuenta del usuario.
     * Se invoca cuando el usuario intenta pagar y no tiene fondos suficientes.
     */
    private void generarMultaYSuspenderCuenta(Deuda deuda) {
        try {
            Usuario usuario = deuda.getUsuario();
            if (usuario == null) return;

            // Verificar si ya existe una multa para esta deuda para no duplicar
            boolean yaMultada = deudaRepository.findByUsuarioIdUsuario(usuario.getIdUsuario())
                .stream().anyMatch(d -> d.getMotivo() != null &&
                    d.getMotivo().contains("Multa por fondos insuficientes") &&
                    d.getMotivo().contains("Deuda ID: " + deuda.getId()));
            if (yaMultada) return;

            // Crear multa del 10%
            BigDecimal multaMonto = deuda.getMonto()
                .multiply(new BigDecimal("0.10"))
                .setScale(2, java.math.RoundingMode.HALF_UP);

            Deuda multa = new Deuda();
            multa.setUsuario(usuario);
            multa.setMonto(multaMonto);
            multa.setMotivo("Multa por fondos insuficientes (10%) - Deuda ID: " + deuda.getId());
            multa.setPagada(false);
            deudaRepository.save(multa);

            // Suspender cuenta del cliente
            if (usuario.getCliente() != null) {
                usuario.getCliente().setEstado("incativo");
                clienteRepository.save(usuario.getCliente());
            }

            // Bloquear cuenta y marcar deuda original
            Cliente cliente = usuario.getCliente();
            cliente.setEstado("incativo");
            clienteRepository.save(cliente);
        
            if (deuda.getMotivo() != null && !deuda.getMotivo().contains("(Multada por falta de fondos)")) {
                deuda.setMotivo(deuda.getMotivo() + " (Multada por falta de fondos)");
                deudaRepository.save(deuda);
            }

            // Notificar al usuario
            Notificacion notif = new Notificacion();
            notif.setUsuario(usuario);
            notif.setMensaje("Tu cuenta ha sido SUSPENDIDA temporalmente por fondos insuficientes al intentar pagar. " +
                "Se generó una multa del 10% (USD " + String.format("%.2f", multaMonto) + "). " +
                "Tienes 72 horas para abonar la deuda original y la multa para rehabilitar tu cuenta.");
            notif.setTipo("deuda");
            notif.setFechaCreacion(LocalDateTime.now());
            notificacionRepository.save(notif);

        } catch (Exception e) {
            System.err.println("Error generando multa: " + e.getMessage());
        }
    }

}
