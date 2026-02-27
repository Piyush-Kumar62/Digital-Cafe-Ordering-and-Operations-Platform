package com.digitalcafe.mapper;

import com.digitalcafe.dto.response.OrderResponse;
import com.digitalcafe.entity.Order;
import com.digitalcafe.entity.OrderItem;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Order entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface OrderMapper {

    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "bookingNumber", source = "booking.bookingNumber")
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", expression = "java(getCustomerName(order))")
    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    @Mapping(target = "items", source = "orderItems")
    @Mapping(target = "preparingByChefName", expression = "java(getChefName(order))")
    @Mapping(target = "servedByWaiterName", expression = "java(getWaiterName(order))")
    @Mapping(target = "payment", expression = "java(mapPaymentSummary(order))")
    OrderResponse toResponse(Order order);

    List<OrderResponse> toResponseList(List<Order> orders);

    @Mapping(target = "menuItemId", source = "menuItem.id")
    @Mapping(target = "menuItemName", source = "menuItem.name")
    OrderResponse.OrderItemResponse toOrderItemResponse(OrderItem orderItem);

    List<OrderResponse.OrderItemResponse> toOrderItemResponseList(List<OrderItem> orderItems);

    default String getCustomerName(Order order) {
        if (order.getCustomer() != null && order.getCustomer().getProfile() != null) {
            return order.getCustomer().getProfile().getFullName();
        }
        return null;
    }

    default String getChefName(Order order) {
        if (order.getPreparingByChef() != null && order.getPreparingByChef().getProfile() != null) {
            return order.getPreparingByChef().getProfile().getFullName();
        }
        return null;
    }

    default String getWaiterName(Order order) {
        if (order.getServedByWaiter() != null && order.getServedByWaiter().getProfile() != null) {
            return order.getServedByWaiter().getProfile().getFullName();
        }
        return null;
    }

    default OrderResponse.PaymentSummary mapPaymentSummary(Order order) {
        if (order.getPayment() == null) {
            return null;
        }
        return OrderResponse.PaymentSummary.builder()
                .paymentId(order.getPayment().getId())
                .status(order.getPayment().getStatus().name())
                .transactionId(order.getPayment().getTransactionId())
                .completedAt(order.getPayment().getCompletedAt())
                .build();
    }

    // Add mapping for legacy OrderDTO
    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", expression = "java(getCustomerName(order))")
    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    @Mapping(target = "status", expression = "java(order.getStatus().name())")
    @Mapping(target = "orderItems", source = "orderItems")
    com.digitalcafe.dto.OrderDTO toDTO(Order order);

    @Mapping(target = "menuItemId", source = "menuItem.id")
    @Mapping(target = "menuItemName", source = "menuItem.name")
    com.digitalcafe.dto.OrderItemDTO toOrderItemDTO(OrderItem orderItem);

    List<com.digitalcafe.dto.OrderItemDTO> toOrderItemDTOList(List<OrderItem> orderItems);
}
