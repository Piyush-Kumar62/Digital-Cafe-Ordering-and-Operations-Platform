package com.digitalcafe.repository;

import com.digitalcafe.model.Cafe;
import com.digitalcafe.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CafeRepository extends JpaRepository<Cafe, Long> {
    List<Cafe> findByActive(Boolean active);
    List<Cafe> findByCity(String city);
    List<Cafe> findByOwnerId(Long ownerId);
    List<Cafe> findByOwnerIdAndActive(Long ownerId, Boolean active);
    List<Cafe> findByOwner(User owner);
}
