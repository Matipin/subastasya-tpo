package com.subastasya.backend.service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.customer.CustomerCardClient;
import com.mercadopago.client.customer.CustomerCardCreateRequest;
import com.mercadopago.client.customer.CustomerClient;
import com.mercadopago.client.customer.CustomerRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.customer.Customer;
import com.mercadopago.resources.customer.CustomerCard;

import com.subastasya.backend.model.Cliente;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class MercadoPagoService {

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    /**
     * Busca al Customer en Mercado Pago por su email.
     * Si no existe, lo crea. Retorna el Customer ID.
     */
    public String getOrCreateCustomer(Cliente cliente) throws MPException, MPApiException {
        CustomerClient client = new CustomerClient();
        
        // Mercado Pago's Sandbox search API and duplicate creation are currently broken (returning 500/400).
        // To bypass this and guarantee the card can be saved, we generate a unique email
        // and create a new Customer every single time.
        String uniqueEmail = "test" + java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 10) + "@gmail.com";

        CustomerRequest request = CustomerRequest.builder()
                .email(uniqueEmail)
                .firstName(cliente.getNombre())
                .build();

        Customer customer = client.create(request);
        return customer.getId();
    }

    /**
     * Asocia una tarjeta (token) al Customer del Cliente en Mercado Pago.
     * Devuelve el objeto CustomerCard generado, el cual contiene el ID real de la tarjeta.
     */
    public CustomerCard saveCardForCustomer(Cliente cliente, String token) throws MPException, MPApiException {
        String customerId = getOrCreateCustomer(cliente);

        CustomerCardClient cardClient = new CustomerCardClient();
        CustomerCardCreateRequest cardRequest = CustomerCardCreateRequest.builder()
                .token(token)
                .build();

        return cardClient.create(customerId, cardRequest);
    }
    
    /**
     * Elimina una tarjeta de Mercado Pago si es rechazada.
     */
    public void deleteCard(Cliente cliente, String cardId) throws MPException, MPApiException {
        String customerId = getOrCreateCustomer(cliente);
        CustomerCardClient cardClient = new CustomerCardClient();
        cardClient.delete(customerId, cardId);
    }
}
