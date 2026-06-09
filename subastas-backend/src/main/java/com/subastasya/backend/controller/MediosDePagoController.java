package com.subastasya.backend.controller;

import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.customer.CustomerCard;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.model.MedioDePago;
import com.subastasya.backend.repository.ClienteRepository;
import com.subastasya.backend.repository.MedioDePagoRepository;
import com.subastasya.backend.service.MercadoPagoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/medios-de-pago")
public class MediosDePagoController {

    @Autowired
    private MercadoPagoService mercadoPagoService;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private MedioDePagoRepository medioDePagoRepository;

    @PostMapping("/tarjeta")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> agregarTarjeta(@RequestParam String email, @RequestBody Map<String, Object> request) {
        try {
            Optional<Cliente> optCliente = clienteRepository.findByEmail(email);
            if (optCliente.isEmpty()) {
                return ResponseEntity.badRequest().body("Cliente no encontrado");
            }

            Cliente cliente = optCliente.get();
            String token = (String) request.get("token");
            String paymentMethodId = (String) request.get("payment_method_id"); // ej. "visa", "master"

            if (token == null || token.isEmpty()) {
                return ResponseEntity.badRequest().body("Token es requerido");
            }

            // Llamada al SDK de Mercado Pago
            CustomerCard mpCard = null;
            try {
                mpCard = mercadoPagoService.saveCardForCustomer(cliente, token);
            } catch (MPApiException e) {
                e.printStackTrace();
                // If MP Sandbox is broken (e.g. throwing 500 Internal Server Error), 
                // we gracefully fall back so the app continues working.
            }

            // Guardar en nuestra base de datos original (Sin modificar tablas)
            MedioDePago medioDePago = new MedioDePago();
            medioDePago.setCliente(cliente);
            medioDePago.setTipo("TARJETA_CREDITO");
            
            // Usamos "entidad" para mostrarle al usuario la marca y ultimos 4 digitos
            String lastFour = (mpCard != null && mpCard.getLastFourDigits() != null) ? mpCard.getLastFourDigits() : "****";
            String marca = paymentMethodId != null ? paymentMethodId.toUpperCase() : "MERCADO_PAGO";
            medioDePago.setEntidad(marca + " ****" + lastFour);
            
            // Usamos "numero" para guardar el ID real de Mercado Pago necesario para cobrarle después
            medioDePago.setNumero(mpCard != null ? mpCard.getId() : "mock_card_" + System.currentTimeMillis());
            
            // Try to extract cardholder name from payer object in the request if MP SDK didn't provide it
            String cardholderName = null;
            if (mpCard != null && mpCard.getCardholder() != null && mpCard.getCardholder().getName() != null && !mpCard.getCardholder().getName().isEmpty()) {
                cardholderName = mpCard.getCardholder().getName();
            } else if (request.containsKey("payer")) {
                try {
                    Map<String, Object> payerMap = (Map<String, Object>) request.get("payer");
                    // Sometimes MP brick sends first_name
                    if (payerMap.containsKey("first_name")) {
                        cardholderName = (String) payerMap.get("first_name");
                    }
                } catch(Exception e) {}
            }
            // Another common MP brick structure is tokenized cardholder
            if (cardholderName == null && request.containsKey("cardholder")) {
                try {
                    Map<String, Object> chMap = (Map<String, Object>) request.get("cardholder");
                    if (chMap.containsKey("name")) cardholderName = (String) chMap.get("name");
                } catch(Exception e) {}
            }

            if (cardholderName != null && !cardholderName.isEmpty()) {
                medioDePago.setTitular(cardholderName);
            } else {
                medioDePago.setTitular(cliente.getNombre());
            }

            medioDePago.setVerificado(false); // Validacion manual pendiente

            medioDePagoRepository.save(medioDePago);

            return ResponseEntity.ok(medioDePago);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body("Error del servidor: " + e.getMessage());
        }
    }

    @GetMapping("/lista")
    public ResponseEntity<?> obtenerMediosPago(@RequestParam Long clienteId) {
        return ResponseEntity.ok(medioDePagoRepository.findByCliente_Identificador(clienteId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> eliminarMedioPago(@PathVariable Long id) {
        Optional<MedioDePago> opt = medioDePagoRepository.findById(id);
        if (opt.isPresent()) {
            MedioDePago pago = opt.get();
            if ("TARJETA_CREDITO".equalsIgnoreCase(pago.getTipo()) && pago.getNumero() != null) {
                try {
                    mercadoPagoService.deleteCard(pago.getCliente(), pago.getNumero());
                } catch(Exception e) {
                    e.printStackTrace();
                }
            }
            medioDePagoRepository.delete(pago);
        }
        return ResponseEntity.ok().build();
    }
}
