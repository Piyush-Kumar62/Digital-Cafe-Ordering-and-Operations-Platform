package com.digitalcafe.mapper;

import com.digitalcafe.dto.response.PaymentResponse;
import com.digitalcafe.entity.Payment;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Payment entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PaymentMapper {

    @Mapping(target = "orderId", source = "order.id")
    @Mapping(target = "orderNumber", source = "order.orderNumber")
    PaymentResponse toResponse(Payment payment);

    List<PaymentResponse> toResponseList(List<Payment> payments);
}
