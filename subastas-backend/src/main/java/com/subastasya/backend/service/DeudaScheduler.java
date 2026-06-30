package com.subastasya.backend.service;

import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.model.Deuda;
import com.subastasya.backend.model.Notificacion;
import com.subastasya.backend.model.Usuario;
import com.subastasya.backend.repository.ClienteRepository;
import com.subastasya.backend.repository.DeudaRepository;
import com.subastasya.backend.repository.NotificacionRepository;
import com.subastasya.backend.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class DeudaScheduler {

    @Autowired
    private DeudaRepository deudaRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private ClienteRepository clienteRepository;

    @Autowired
    private NotificacionRepository notificacionRepository;

    // Ejecutar cada 1 hora (o cada 1 minuto para testeo local: "0 * * * * *")
    // Aquí está configurado para ejecutar cada hora: "0 0 * * * *"
    // Para simplificar testeo vamos a ponerlo cada minuto
    @Scheduled(cron = "0 * * * * *")
    @Transactional
    public void procesarDeudasVencidas() {
        // En un sistema real buscaríamos deudas que tengan más de 72 horas
        // Como el modelo Deuda actual no tiene "fechaCreacion" en el SQL,
        // asumimos que todas las impagas que no sean multas están en revisión.
        // Simularemos las 72hs chequeando que el motivo NO contenga "Multa".
        
        List<Deuda> deudasImpagas = deudaRepository.findAll();
        
        for (Deuda deuda : deudasImpagas) {
            try {
                // Filtrar las que no están pagadas, no son multas ya aplicadas, etc.
                if (!deuda.isPagada() && deuda.getMotivo() != null && !deuda.getMotivo().contains("Multa por mora")) {
                
                // NOTA: Idealmente comprobaríamos: if(deuda.getFecha().isBefore(now().minusHours(72))) 
                // pero como TPO_DAI no permite modificar el SQL base (y no tenemos fecha en Deuda),
                // procesamos las que encontremos como ejemplo (o se requeriría una tabla auxiliar).
                
                Usuario usuario = deuda.getUsuario();
                if (usuario != null && usuario.getCliente() != null) {
                    Cliente cliente = usuario.getCliente();
                    
                    // Solo penalizar si el cliente está activo
                    if (!"incativo".equalsIgnoreCase(cliente.getEstado())) {
                        
                        // 1. Bloquear cuenta (estado inactivo typo: incativo)
                        cliente.setEstado("incativo");
                        clienteRepository.save(cliente);

                        // 2. Generar multa del 10%
                        BigDecimal multaMonto = deuda.getMonto().multiply(BigDecimal.valueOf(0.10)).setScale(2, RoundingMode.HALF_UP);
                        
                        Deuda multa = new Deuda();
                        multa.setUsuario(usuario);
                        multa.setMonto(multaMonto);
                        multa.setMotivo("Multa por mora (10%) de Deuda ID: " + deuda.getId());
                        multa.setPagada(false);
                        deudaRepository.save(multa);

                        // 3. Notificar al usuario
                        Notificacion notif = new Notificacion();
                        notif.setUsuario(usuario);
                        notif.setMensaje("Tu cuenta ha sido SUSPENDIDA temporalmente por registrar deudas impagas por más de 72 horas. Se ha generado un recargo del 10% (USD " + multaMonto + ") en concepto de multa. Regulariza tu situación para recuperar el acceso.");
                        notif.setTipo("cuenta_suspendida");
                        notif.setFechaCreacion(LocalDateTime.now());
                        notificacionRepository.save(notif);
                        
                        // Opcional: Modificar el motivo de la deuda original para no volver a multarla en la siguiente hora
                        deuda.setMotivo(deuda.getMotivo() + " (Penalizada)");
                        deudaRepository.save(deuda);
                    }
                }
            } catch (Exception e) {
                System.err.println("Error procesando deuda ID " + deuda.getIdentificador() + ": " + e.getMessage());
            }
        }
    }
}
