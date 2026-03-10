package com.digitalcafe.repository;

import com.digitalcafe.entity.PaymentWebhookEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentWebhookEventRepository extends JpaRepository<PaymentWebhookEvent, Long> {
    Optional<PaymentWebhookEvent> findByProviderAndEventId(
            PaymentWebhookEvent.Provider provider,
            String eventId
    );

    Page<PaymentWebhookEvent> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
