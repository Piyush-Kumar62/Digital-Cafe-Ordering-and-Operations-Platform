package com.digitalcafe.controller;

import com.digitalcafe.dto.response.PostalLookupResponseDTO;
import com.digitalcafe.service.PostalLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/postal")
@RequiredArgsConstructor
public class PostalLookupController {

    private final PostalLookupService postalLookupService;

    @GetMapping("/pincode/{pin}")
    public ResponseEntity<PostalLookupResponseDTO> lookupPincode(@PathVariable String pin) {
        try {
            return ResponseEntity.ok(postalLookupService.lookup(pin));
        } catch (Exception ex) {
            return ResponseEntity.ok(PostalLookupResponseDTO.error());
        }
    }
}
