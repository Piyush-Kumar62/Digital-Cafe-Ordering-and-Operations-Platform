package com.digitalcafe.controller;

import com.digitalcafe.model.Cafe;
import com.digitalcafe.service.CafeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cafes")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CafeController {

    private final CafeService cafeService;

    @GetMapping
    public ResponseEntity<List<Cafe>> getAllCafes() {
        List<Cafe> cafes = cafeService.getAllCafes();
        return ResponseEntity.ok(cafes);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Cafe> getCafeById(@PathVariable Long id) {
        Cafe cafe = cafeService.getCafeById(id);
        return ResponseEntity.ok(cafe);
    }

    @GetMapping("/active")
    public ResponseEntity<List<Cafe>> getActiveCafes() {
        List<Cafe> cafes = cafeService.getActiveCafes();
        return ResponseEntity.ok(cafes);
    }

    @GetMapping("/city/{city}")
    public ResponseEntity<List<Cafe>> getCafesByCity(@PathVariable String city) {
        List<Cafe> cafes = cafeService.getCafesByCity(city);
        return ResponseEntity.ok(cafes);
    }

    @PostMapping
    public ResponseEntity<Cafe> createCafe(@RequestBody Cafe cafe) {
        Cafe createdCafe = cafeService.createCafe(cafe);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdCafe);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cafe> updateCafe(
            @PathVariable Long id,
            @RequestBody Cafe cafe) {
        Cafe updatedCafe = cafeService.updateCafe(id, cafe);
        return ResponseEntity.ok(updatedCafe);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCafe(@PathVariable Long id) {
        cafeService.deleteCafe(id);
        return ResponseEntity.noContent().build();
    }
}
