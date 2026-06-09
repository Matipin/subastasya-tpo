package com.subastasya.backend;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.customer.CustomerCardClient;
import com.mercadopago.client.customer.CustomerCardCreateRequest;
import com.mercadopago.client.customer.CustomerClient;
import com.mercadopago.client.customer.CustomerRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.resources.customer.Customer;
import com.mercadopago.resources.customer.CustomerCard;
import java.util.HashMap;
import java.util.Map;

public class TestMP {
    public static void main(String[] args) {
        String accessToken = "TEST-6281816190072559-060820-7f041c2f9c198aa7db0a5c7d8e7a3a26-1436955656";
        MercadoPagoConfig.setAccessToken(accessToken);
        try {
            CustomerClient client = new CustomerClient();
            Map<String, Object> filters = new HashMap<>();
            filters.put("email", "matias@test.com"); // We test with a dummy email
            
            MPSearchRequest searchRequest = MPSearchRequest.builder()
                    .offset(0)
                    .limit(10)
                    .filters(filters)
                    .build();
            
            System.out.println("Searching customer...");
            com.mercadopago.net.MPResultsResourcesPage<Customer> searchResult = client.search(searchRequest);
            System.out.println("Search result: " + searchResult.getResults().size());
            
            if (searchResult.getResults().isEmpty()) {
                System.out.println("Creating customer...");
                CustomerRequest request = CustomerRequest.builder()
                        .email("matias@test.com")
                        .firstName("Matias")
                        .build();
                Customer customer = client.create(request);
                System.out.println("Customer created: " + customer.getId());
            } else {
                System.out.println("Customer found: " + searchResult.getResults().get(0).getId());
            }
        } catch (MPApiException e) {
            System.out.println("API Exception: " + e.getApiResponse().getContent());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
