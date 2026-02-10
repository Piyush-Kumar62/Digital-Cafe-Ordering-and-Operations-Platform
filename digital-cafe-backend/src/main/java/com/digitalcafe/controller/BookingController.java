package com.digitalcafe.controller;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.ApiResponse;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for booking management operations.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<BookingResponse>> createBooking(
            @Valid @RequestBody BookingRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long customerId = getUserIdFromAuthentication(authentication);

        BookingResponse response = bookingService.createBooking(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Booking created successfully", response));
    }

    @GetMapping("/{bookingId}")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<BookingResponse>> getBookingById(@PathVariable Long bookingId) {
        BookingResponse response = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(ApiResponse.success("Booking retrieved successfully", response));
    }

    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<BookingResponse>>> getMyBookings() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long customerId = getUserIdFromAuthentication(authentication);

        List<BookingResponse> response = bookingService.getBookingsByCustomerId(customerId);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully", response));
    }

    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasAnyRole('CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<ApiResponse<PageResponse<BookingResponse>>> getBookingsByCafeId(
            @PathVariable Long cafeId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "bookingTime") String sortBy,
            @RequestParam(defaultValue = "DESC") String sortDirection) {

        Sort.Direction direction = Sort.Direction.fromString(sortDirection);
        Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortBy));

        PageResponse<BookingResponse> response = bookingService.getBookingsByCafeId(cafeId, pageable);
        return ResponseEntity.ok(ApiResponse.success("Bookings retrieved successfully", response));
    }

    @PatchMapping("/{bookingId}/cancel")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ApiResponse<BookingResponse>> cancelBooking(@PathVariable Long bookingId) {
        BookingResponse response = bookingService.cancelBooking(bookingId);
        return ResponseEntity.ok(ApiResponse.success("Booking cancelled successfully", response));
    }

    @PatchMapping("/{bookingId}/status")
    @PreAuthorize("hasAnyRole('CAFE_OWNER', 'WAITER')")
    public ResponseEntity<ApiResponse<BookingResponse>> updateBookingStatus(
            @PathVariable Long bookingId,
            @RequestParam Booking.BookingStatus status) {
        BookingResponse response = bookingService.updateBookingStatus(bookingId, status);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated successfully", response));
    }

    private Long getUserIdFromAuthentication(Authentication authentication) {
        // This will be implemented based on your security context structure
        // For now, returning a placeholder
        return 1L; // TODO: Extract user ID from authentication
    }
}

