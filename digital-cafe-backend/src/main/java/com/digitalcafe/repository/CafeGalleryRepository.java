package com.digitalcafe.repository;

import com.digitalcafe.entity.CafeGallery;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CafeGalleryRepository extends JpaRepository<CafeGallery, Long> {

    List<CafeGallery> findByCafeId(Long cafeId);

}