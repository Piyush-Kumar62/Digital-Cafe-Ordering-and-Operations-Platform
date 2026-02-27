package com.digitalcafe.mapper;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.entity.Booking;
import org.mapstruct.*;

import java.util.List;

/**
 * MapStruct mapper for Booking entity and DTOs.
 */
@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface BookingMapper {

    @Mapping(target = "customerId", source = "customer.id")
    @Mapping(target = "customerName", expression = "java(getCustomerName(booking))")
    @Mapping(target = "customerEmail", source = "customer.email")
    @Mapping(target = "cafeId", source = "cafe.id")
    @Mapping(target = "cafeName", source = "cafe.name")
    @Mapping(target = "tableId", source = "table.id")
    @Mapping(target = "tableNumber", source = "table.tableNumber")
    @Mapping(target = "canOrder", expression = "java(booking.isActive())")
    @Mapping(target = "hasOrder", expression = "java(booking.getOrder() != null)")
    BookingResponse toResponse(Booking booking);

    List<BookingResponse> toResponseList(List<Booking> bookings);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "bookingNumber", ignore = true)
    @Mapping(target = "customer", ignore = true)
    @Mapping(target = "cafe", ignore = true)
    @Mapping(target = "table", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "order", ignore = true)
    @Mapping(target = "cancelledAt", ignore = true)
    @Mapping(target = "cancellationReason", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    Booking toEntity(BookingRequest request);

    default String getCustomerName(Booking booking) {
        if (booking.getCustomer() != null && booking.getCustomer().getProfile() != null) {
            return booking.getCustomer().getProfile().getFullName();
        }
        return null;
    }
}
