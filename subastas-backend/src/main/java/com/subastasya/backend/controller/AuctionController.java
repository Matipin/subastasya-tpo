package com.subastasya.backend.controller;

import com.subastasya.backend.model.Subasta;
import com.subastasya.backend.model.Catalogo;
import com.subastasya.backend.model.ItemCatalogo;
import com.subastasya.backend.model.Foto;
import com.subastasya.backend.model.Pujo;
import com.subastasya.backend.model.Asistente;
import com.subastasya.backend.model.Cliente;
import com.subastasya.backend.repository.SubastaRepository;
import com.subastasya.backend.repository.CatalogoRepository;
import com.subastasya.backend.repository.ItemCatalogoRepository;
import com.subastasya.backend.repository.FotoRepository;
import com.subastasya.backend.repository.PujoRepository;
import com.subastasya.backend.repository.AsistenteRepository;
import com.subastasya.backend.repository.ClienteRepository;
import com.subastasya.backend.controller.dto.ArticuloDTO;
import com.subastasya.backend.controller.dto.BidRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;
import java.util.ArrayList;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/auctions")
@RequiredArgsConstructor
public class AuctionController {

    private final SubastaRepository subastaRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final FotoRepository fotoRepository;
    private final PujoRepository pujoRepository;
    private final AsistenteRepository asistenteRepository;
    private final ClienteRepository clienteRepository;

    @GetMapping
    public ResponseEntity<List<Subasta>> getSubastas() {
        List<Subasta> subastas = subastaRepository.findAll();
        for (Subasta subasta : subastas) {
            List<ArticuloDTO> articulos = new ArrayList<>();
            List<Catalogo> catalogos = catalogoRepository.findBySubastaIdentificador(subasta.getIdentificador());
            if (!catalogos.isEmpty()) {
                subasta.setNombre(catalogos.get(0).getDescripcion());
            } else {
                subasta.setNombre("Subasta #" + subasta.getIdentificador());
            }
            for (Catalogo catalogo : catalogos) {
                List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoIdentificador(catalogo.getIdentificador());
                for (ItemCatalogo item : items) {
                    ArticuloDTO dto = new ArticuloDTO();
                    dto.setId(item.getProducto().getIdentificador());
                    dto.setNombre(item.getProducto().getDescripcionCatalogo());
                    dto.setDescripcion(item.getProducto().getDescripcionCompleta());
                    dto.setPrecioBase(item.getPrecioBase().doubleValue());
                    List<Foto> fotos = fotoRepository.findByProductoIdentificador(item.getProducto().getIdentificador());
                    if (!fotos.isEmpty() && fotos.get(0).getFoto() != null) {
                        dto.setUrlImagen(new String(fotos.get(0).getFoto(), java.nio.charset.StandardCharsets.UTF_8));
                    }
                    articulos.add(dto);
                }
            }
            subasta.setArticulos(articulos);
        }
        return ResponseEntity.ok(subastas);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getAuctionDetails(@PathVariable Integer id) {
        Optional<Subasta> subasta = subastaRepository.findById(Long.valueOf(id));
        if (subasta.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Subasta no encontrada.");
        }
        return ResponseEntity.ok(subasta.get());
    }

    @GetMapping("/{id}/catalog")
    public ResponseEntity<?> getCatalog(@PathVariable Integer id) {
        List<Catalogo> catalogos = catalogoRepository.findBySubastaIdentificador(Long.valueOf(id));
        if (catalogos.isEmpty()) {
            return ResponseEntity.ok(new ArrayList<>());
        }
        List<ItemCatalogo> items = itemCatalogoRepository.findByCatalogoIdentificador(catalogos.get(0).getIdentificador());
        return ResponseEntity.ok(items);
    }

    @GetMapping("/{id}/items/{item_id}/status")
    public ResponseEntity<?> getStatus(@PathVariable Integer id, @PathVariable Integer item_id) {
        List<Pujo> pujos = pujoRepository.findByItemIdentificador(Long.valueOf(item_id));
        if (pujos.isEmpty()) {
            Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findById(Long.valueOf(item_id));
            if (itemOpt.isPresent()) {
                return ResponseEntity.ok(new StatusResponse(itemOpt.get().getPrecioBase(), itemOpt.get().getPrecioBase().doubleValue() * 1.01, itemOpt.get().getPrecioBase().doubleValue() * 1.20, "Nadie"));
            }
        }
        Pujo maxPujo = pujos.stream().max((p1, p2) -> p1.getImporte().compareTo(p2.getImporte())).orElse(null);
        if (maxPujo != null) {
            Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findById(Long.valueOf(item_id));
            double base = itemOpt.isPresent() ? itemOpt.get().getPrecioBase().doubleValue() : 0;
            double actual = maxPujo.getImporte().doubleValue();
            double min = actual + (base * 0.01);
            double max = actual + (base * 0.20);
            return ResponseEntity.ok(new StatusResponse(maxPujo.getImporte(), min, max, "ID Asistente: " + maxPujo.getAsistente().getIdentificador()));
        }
        return ResponseEntity.ok(new StatusResponse(0.0, 0.0, 0.0, "Nadie"));
    }

    @PostMapping("/{id}/items/{item_id}/bid")
    public ResponseEntity<?> bid(@PathVariable Integer id, @PathVariable Integer item_id, @RequestBody BidRequest request) {
        Optional<ItemCatalogo> itemOpt = itemCatalogoRepository.findById(Long.valueOf(item_id));
        if (itemOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Ítem no encontrado.");
        }
        ItemCatalogo item = itemOpt.get();
        double base = item.getPrecioBase().doubleValue();

        List<Pujo> pujos = pujoRepository.findByItemIdentificador(Long.valueOf(item_id));
        double maxActual = pujos.stream().mapToDouble(p -> p.getImporte().doubleValue()).max().orElse(base);
        
        double minAceptado = maxActual == base ? base : maxActual + (base * 0.01);
        double maxAceptado = maxActual == base ? base + (base * 0.20) : maxActual + (base * 0.20);

        if (request.getAmount() < minAceptado) {
            return ResponseEntity.badRequest().body("La oferta debe ser al menos " + minAceptado);
        }
        
        Optional<Subasta> subastaOpt = subastaRepository.findById(Long.valueOf(id));
        boolean sinLimite = false;
        if (subastaOpt.isPresent()) {
            String cat = subastaOpt.get().getCategoria();
            if ("oro".equalsIgnoreCase(cat) || "platino".equalsIgnoreCase(cat)) {
                sinLimite = true;
            }
        }
        
        if (!sinLimite && request.getAmount() > maxAceptado) {
            return ResponseEntity.badRequest().body("La oferta no puede superar " + maxAceptado);
        }

        Optional<Asistente> asisOpt = asistenteRepository.findById(Long.valueOf(request.getAsistenteId() != null ? request.getAsistenteId() : 1));
        if (asisOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Asistente no encontrado.");
        }

        Pujo nuevoPujo = new Pujo();
        nuevoPujo.setItem(item);
        nuevoPujo.setAsistente(asisOpt.get());
        nuevoPujo.setImporte(java.math.BigDecimal.valueOf(request.getAmount()));
        nuevoPujo.setGanador("no");
        pujoRepository.save(nuevoPujo);

        return ResponseEntity.status(HttpStatus.CREATED).body("Puja realizada exitosamente.");
    }

    @GetMapping("/{id}/items/{item_id}/history")
    public ResponseEntity<?> getBidHistory(@PathVariable Integer id, @PathVariable Integer item_id) {
        List<Pujo> pujos = pujoRepository.findByItemIdentificador(Long.valueOf(item_id));
        return ResponseEntity.ok(pujos);
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<?> joinAuction(@PathVariable Integer id, @RequestBody JoinRequest request) {
        Optional<Subasta> subastaOpt = subastaRepository.findById(Long.valueOf(id));
        Optional<Cliente> clienteOpt = clienteRepository.findById(Long.valueOf(request.getClienteId()));
        
        if (subastaOpt.isEmpty() || clienteOpt.isEmpty()) {
            return ResponseEntity.badRequest().body("Subasta o cliente no encontrado.");
        }

        Asistente asistente = new Asistente();
        asistente.setSubasta(subastaOpt.get());
        asistente.setCliente(clienteOpt.get());
        asistente.setNumeroPostor((int)(Math.random() * 1000));
        asistenteRepository.save(asistente);
        return ResponseEntity.ok(asistente);
    }

    @DeleteMapping("/{id}/leave")
    public ResponseEntity<?> leaveAuction(@PathVariable Integer id, @RequestBody JoinRequest request) {
        return ResponseEntity.ok("Participación cancelada.");
    }
}

class StatusResponse {
    public Object monto_actual;
    public double puja_minima;
    public double puja_maxima;
    public String ultimo_postor;
    public StatusResponse(Object a, double b, double c, String d) {
        this.monto_actual = a; this.puja_minima = b; this.puja_maxima = c; this.ultimo_postor = d;
    }
}

class JoinRequest {
    private Integer clienteId;
    public Integer getClienteId() { return clienteId; }
    public void setClienteId(Integer clienteId) { this.clienteId = clienteId; }
}
