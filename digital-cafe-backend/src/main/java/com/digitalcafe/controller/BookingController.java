package com.digitalcafe.controller;

import com.digitalcafe.dto.BookingDTO;
import com.digitalcafe.dto.BookingRequestDTO;
import com.digitalcafe.dto.MessageResponse;
import com.digitalcafe.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking (Customer only)
     * POST /api/bookings
     */
    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<BookingDTO> createBooking(
            @Valid @RequestBody BookingRequestDTO request,
            Authentication authentication) {
        String username = authentication.getName();
        BookingDTO booking = bookingService.createBooking(username, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    /**
     * Get all bookings for current customer
     * GET /api/bookings/my-bookings
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<BookingDTO>> getMyBookings(Authentication authentication) {
        String username = authentication.getName();
        List<BookingDTO> bookings = bookingService.getBookingsByCustomer(username);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get booking by ID
     * GET /api/bookings/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<BookingDTO> getBookingById(@PathVariable Long id) {
        BookingDTO booking = bookingService.getBookingById(id);
        return ResponseEntity.ok(booking);
    }

    /**
     * Get all bookings for a cafe (Cafe Owner, Chef, Waiter)
     * GET /api/bookings/cafe/{cafeId}
     */
    @GetMapping("/cafe/{cafeId}")
    @PreAuthorize("hasAnyRole('CAFE_OWNER', 'CHEF', 'WAITER')")
    public ResponseEntity<List<BookingDTO>> getBookingsByCafe(@PathVariable Long cafeId) {
        List<BookingDTO> bookings = bookingService.getBookingsByCafe(cafeId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Cancel a booking
     * PATCH /api/bookings/{id}/cancel
     */
    @PatchMapping("/{id}/cancel")
    public ResponseEntity<MessageResponse> cancelBooking(@PathVariable Long id) {
        bookingService.cancelBooking(id);
        return ResponseEntity.ok(new MessageResponse("Booking cancelled successfully"));
    }

    /**
     * Confirm a booking (Cafe Owner)
     * PATCH /api/bookings/{id}/confirm
     */
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('CAFE_OWNER')")
    public ResponseEntity<MessageResponse> confirmBooking(@PathVariable Long id) {
        bookingService.confirmBooking(id);
        return ResponseEntity.ok(new MessageResponse("Booking confirmed successfully"));
    }

    /**
     * Complete a booking (Waiter)
     * PATCH /api/bookings/{id}/complete
     */
    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<MessageResponse> completeBooking(@PathVariable Long id) {
        bookingService.completeBooking(id);
        return ResponseEntity.ok(new MessageResponse("Booking completed successfully"));
    }
}
