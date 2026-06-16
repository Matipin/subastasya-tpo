package com.subastasya.backend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Service
public class EmailService {

    @Value("${google.script.url}")
    private String scriptUrl;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private void sendEmailViaGoogle(String to, String subject, String text) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("to", to);
            payload.put("subject", subject);
            payload.put("html", text.replace("\n", "<br>"));

            String jsonPayload = objectMapper.writeValueAsString(payload);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(new URI(scriptUrl))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            // Usamos HttpClient configurado para seguir redirecciones, ya que Google Apps Script hace redirect (302)
            HttpClient client = HttpClient.newBuilder()
                    .followRedirects(HttpClient.Redirect.NORMAL)
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
                    
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() >= 400) {
                System.err.println("Error al enviar email a " + to + ": " + response.body());
            } else {
                System.out.println("Email enviado exitosamente a " + to + " usando Google Apps Script");
            }
        } catch (Exception e) {
            System.err.println("Excepción al enviar email a " + to + ": " + e.getMessage());
            e.printStackTrace();
        }
    }

    public void sendActivationEmail(String to, String token) {
        String text = "¡Hola!\n\n" +
                "Buenas noticias, tus datos han sido revisados y validados por nuestro equipo.\n\n" +
                "Para activar tu cuenta y configurar tu contraseña, ingresá a la app, ve a la sección 'Activar Cuenta' " +
                "y pegá el siguiente código de activación:\n\n" +
                token + "\n\n" +
                "¡Te esperamos en las subastas!\n" +
                "El equipo de Sello.";
        
        sendEmailViaGoogle(to, "SubastasYa - Tu cuenta ha sido validada", text);
    }

    public void sendRecoveryEmail(String to, String token) {
        String text = "¡Hola!\n\n" +
                "Hemos recibido una solicitud para recuperar tu contraseña.\n\n" +
                "Para crear una nueva contraseña, ingresá a la app, ve a la sección 'Recuperar Contraseña' " +
                "y pegá el siguiente código de recuperación:\n\n" +
                token + "\n\n" +
                "Si no solicitaste este cambio, podés ignorar este correo.\n\n" +
                "El equipo de Sello.";
        
        sendEmailViaGoogle(to, "SubastasYa - Recuperación de contraseña", text);
    }

    public void sendRejectionEmail(String to, String reason) {
        String text = "¡Hola!\n\n" +
                "Tu solicitud de registro en SubastasYa ha sido rechazada por el siguiente motivo:\n\n" +
                reason + "\n\n" +
                "Por favor, revisá tus datos e intentá registrarte nuevamente cumpliendo con los requisitos.\n\n" +
                "El equipo de Sello.";

        sendEmailViaGoogle(to, "SubastasYa - Problemas con tu validación", text);
    }
}
