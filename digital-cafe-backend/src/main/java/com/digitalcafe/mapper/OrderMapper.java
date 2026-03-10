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
        if (order == null || order.getCustomer() == null) {
            return null;
        }
        var customer = order.getCustomer();
        if (customer.getProfile() != null && customer.getProfile().getFullName() != null
                && !customer.getProfile().getFullName().isBlank()) {
            return customer.getProfile().getFullName();
        }
        if (customer.getDisplayName() != null && !customer.getDisplayName().isBlank()) {
            return customer.getDisplayName();
        }
        String first = customer.getFirstName() != null ? customer.getFirstName().trim() : "";
        String last = customer.getLastName() != null ? customer.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isBlank()) {
            return full;
        }
        if (customer.getEmail() != null && !customer.getEmail().isBlank()) {
            return customer.getEmail();
        }
        return "Unknown Customer";
    }

    default String getChefName(Order order) {
        if (order == null || order.getPreparingByChef() == null) {
            return null;
        }
        var chef = order.getPreparingByChef();
        if (chef.getProfile() != null && chef.getProfile().getFullName() != null
                && !chef.getProfile().getFullName().isBlank()) {
            return chef.getProfile().getFullName();
        }
        if (chef.getDisplayName() != null && !chef.getDisplayName().isBlank()) {
            return chef.getDisplayName();
        }
        String first = chef.getFirstName() != null ? chef.getFirstName().trim() : "";
        String last = chef.getLastName() != null ? chef.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isBlank()) {
            return full;
        }
        return chef.getEmail();
    }

    default String getWaiterName(Order order) {
        if (order == null || order.getServedByWaiter() == null) {
            return null;
        }
        var waiter = order.getServedByWaiter();
        if (waiter.getProfile() != null && waiter.getProfile().getFullName() != null
                && !waiter.getProfile().getFullName().isBlank()) {
            return waiter.getProfile().getFullName();
        }
        if (waiter.getDisplayName() != null && !waiter.getDisplayName().isBlank()) {
            return waiter.getDisplayName();
        }
        String first = waiter.getFirstName() != null ? waiter.getFirstName().trim() : "";
        String last = waiter.getLastName() != null ? waiter.getLastName().trim() : "";
        String full = (first + " " + last).trim();
        if (!full.isBlank()) {
            return full;
        }
        return waiter.getEmail();
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
