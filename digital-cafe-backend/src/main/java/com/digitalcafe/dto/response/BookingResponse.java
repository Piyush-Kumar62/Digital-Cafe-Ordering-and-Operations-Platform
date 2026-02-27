package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * DTO for booking response.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {

    private Long id;
    private String bookingNumber;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long cafeId;
    private String cafeName;
    private Long tableId;
    private String tableNumber;
    private LocalDate bookingDate;
    private LocalTime bookingTime;
    private Integer numberOfGuests;
    private String status;
    private String specialRequests;
    private LocalDateTime createdAt;
    private Boolean canOrder;
    private Boolean hasOrder;
}
