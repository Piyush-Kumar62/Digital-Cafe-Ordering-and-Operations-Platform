package com.digitalcafe.service;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Booking;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service interface for booking management operations.
 */
public interface BookingService {

    /**
     * Create a new booking
     */
    BookingResponse createBooking(Long customerId, BookingRequest request);

    /**
     * Get booking by ID
     */
    BookingResponse getBookingById(Long bookingId);

    /**
     * Get all bookings for a customer
     */
    List<BookingResponse> getBookingsByCustomerId(Long customerId);

    /**
     * Get all bookings for a cafe
     */
    PageResponse<BookingResponse> getBookingsByCafeId(Long cafeId, Pageable pageable);

    /**
     * Get bookings by status
     */
    List<BookingResponse> getBookingsByStatus(Long customerId, Booking.BookingStatus status);

    /**
     * Cancel a booking
     */
    BookingResponse cancelBooking(Long bookingId);

    /**
     * Update booking status
     */
    BookingResponse updateBookingStatus(Long bookingId, Booking.BookingStatus status);

    /**
     * Check table availability for booking
     */
    boolean isTableAvailable(Long tableId, LocalDateTime bookingTime);
}

