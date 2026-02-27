package com.digitalcafe.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingRequestDTO {
    
    @NotNull(message = "Table ID is required")
    private Long tableId;
    
    @NotNull(message = "Booking date and time is required")
    @Future(message = "Booking date must be in the future")
    private LocalDateTime bookingDateTime;
    
    @NotNull(message = "Number of guests is required")
    @Positive(message = "Number of guests must be positive")
    private Integer numberOfGuests;
    
    private String specialRequests;
}
