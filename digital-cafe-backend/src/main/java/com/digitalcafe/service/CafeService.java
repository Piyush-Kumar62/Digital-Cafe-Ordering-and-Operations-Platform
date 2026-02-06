package com.digitalcafe.service;

import com.digitalcafe.dto.CreateCafeRequest;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.Cafe;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CafeService {
    
    private final CafeRepository cafeRepository;
    private final UserRepository userRepository;
    
    @Transactional(readOnly = true)
    public List<Cafe> getAllCafes() {
        return cafeRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Cafe getCafeById(Long id) {
        return cafeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", id));
    }
    
    @Transactional(readOnly = true)
    public List<Cafe> getActiveCafes() {
        return cafeRepository.findByActive(true);
    }
    
    @Transactional(readOnly = true)
    public List<Cafe> getCafesByCity(String city) {
        return cafeRepository.findByCity(city);
    }
    
    @Transactional
    public Cafe createCafe(CreateCafeRequest request) {
        User owner = userRepository.findById(request.getOwnerId())
                .orElseThrow(() -> new ResourceNotFoundException("Owner", "id", request.getOwnerId()));
        
        Cafe cafe = new Cafe();
        cafe.setName(request.getName());
        cafe.setDescription(request.getDescription());
        cafe.setAddress(request.getAddress());
        cafe.setCity(request.getCity());
        cafe.setState(request.getState());
        cafe.setPincode(request.getPincode());
        cafe.setPhone(request.getPhone());
        cafe.setEmail(request.getEmail());
        cafe.setOpeningTime(request.getOpeningTime());
        cafe.setClosingTime(request.getClosingTime());
        cafe.setImageUrl(request.getImageUrl());
        cafe.setOwner(owner);
        cafe.setActive(request.getActive() != null ? request.getActive() : true);
        
        return cafeRepository.save(cafe);
    }
    
    @Transactional
    public Cafe updateCafe(Long id, Cafe cafeDetails) {
        Cafe cafe = cafeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", id));
        
        cafe.setName(cafeDetails.getName());
        cafe.setAddress(cafeDetails.getAddress());
        cafe.setCity(cafeDetails.getCity());
        cafe.setPhone(cafeDetails.getPhone());
        cafe.setEmail(cafeDetails.getEmail());
        cafe.setOpeningTime(cafeDetails.getOpeningTime());
        cafe.setClosingTime(cafeDetails.getClosingTime());
        cafe.setActive(cafeDetails.getActive());
        
        return cafeRepository.save(cafe);
    }
    
    @Transactional
    public void deleteCafe(Long id) {
        Cafe cafe = cafeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe", "id", id));
        cafeRepository.delete(cafe);
    }
}
