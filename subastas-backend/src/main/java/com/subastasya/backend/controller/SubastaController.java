package com.subastasya.backend.controller;

import com.subastasya.backend.model.Subasta;
import com.subastasya.backend.model.Catalogo;
import com.subastasya.backend.model.ItemCatalogo;
import com.subastasya.backend.model.Foto;
import com.subastasya.backend.repository.SubastaRepository;
import com.subastasya.backend.repository.CatalogoRepository;
import com.subastasya.backend.repository.ItemCatalogoRepository;
import com.subastasya.backend.repository.FotoRepository;
import com.subastasya.backend.controller.dto.ArticuloDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.stream.Collectors;
import java.util.ArrayList;

import java.util.List;

@RestController
@RequestMapping("/api/v1/subastas")
@RequiredArgsConstructor
public class SubastaController {

    private final SubastaRepository subastaRepository;
    private final CatalogoRepository catalogoRepository;
    private final ItemCatalogoRepository itemCatalogoRepository;
    private final FotoRepository fotoRepository;

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
                    dto.setNombre(catalogo.getDescripcion());
                    
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
}
