package com.digitalcafe.service;

import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.dto.response.PaymentWebhookEventResponse;
import com.digitalcafe.entity.PaymentWebhookEvent;
import com.digitalcafe.repository.PaymentWebhookEventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentWebhookAuditService {

    private final PaymentWebhookEventRepository webhookEventRepository;

    public PageResponse<PaymentWebhookEventResponse> getWebhookEvents(Pageable pageable) {
        Page<PaymentWebhookEvent> page = webhookEventRepository.findAllByOrderByCreatedAtDesc(pageable);
        List<PaymentWebhookEventResponse> content = page.getContent().stream()
                .map(PaymentWebhookEventResponse::fromEntity)
                .toList();

        return PageResponse.<PaymentWebhookEventResponse>builder()
                .content(content)
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .isFirst(page.isFirst())
                .isLast(page.isLast())
                .hasNext(page.hasNext())
                .hasPrevious(page.hasPrevious())
                .build();
    }
}
