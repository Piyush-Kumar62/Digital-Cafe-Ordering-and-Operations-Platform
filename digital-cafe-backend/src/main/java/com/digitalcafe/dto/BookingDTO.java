package com.digitalcafe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BookingDTO {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long cafeId;
    private String cafeName;
    private Long tableId;
    private String tableNumber;
    private LocalDateTime bookingDateTime;
    private Integer numberOfGuests;
    private String status;
    private String specialRequests;
    private LocalDateTime createdAt;
}
