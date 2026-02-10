package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeTable;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.BookingMapper;
import com.digitalcafe.repository.BookingRepository;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.BookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;
    private final CafeTableRepository tableRepository;
    private final BookingMapper bookingMapper;

    @Override
    @Transactional
    public BookingResponse createBooking(Long customerId, BookingRequest request) {
        log.info("Creating booking for customer: {}, cafe: {}, table: {}", customerId, request.getCafeId(), request.getTableId());

        // Validate customer
        User customer = userRepository.findById(customerId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));

        // Validate cafe
        Cafe cafe = cafeRepository.findById(request.getCafeId())
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found"));

        // Validate table
        CafeTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        if (!table.getCafe().getId().equals(cafe.getId())) {
            throw new IllegalArgumentException("Table does not belong to this cafe");
        }

        if (!Boolean.TRUE.equals(table.getIsAvailable())) {
            throw new IllegalArgumentException("Table is not available");
        }

        if (table.getCapacity() < request.getNumberOfGuests()) {
            throw new IllegalArgumentException("Table capacity is insufficient for the number of guests");
        }

        // Check for booking conflicts
        if (hasBookingConflict(table.getId(), request.getBookingDate(), request.getBookingTime())) {
            throw new IllegalArgumentException("Table is already booked for this time slot");
        }

        // Create booking
        Booking booking = new Booking();
        booking.setBookingNumber("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setCustomer(customer);
        booking.setCafe(cafe);
        booking.setTable(table);
        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        booking.setNumberOfGuests(request.getNumberOfGuests());
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);

        booking = bookingRepository.save(booking);
        log.info("Booking created successfully: {}", booking.getBookingNumber());

        return bookingMapper.toResponse(booking);
    }

    @Override
    public BookingResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        return bookingMapper.toResponse(booking);
    }

    @Override
    public List<BookingResponse> getBookingsByCustomerId(Long customerId) {
        List<Booking> bookings = bookingRepository.findByCustomerId(customerId);
        return bookingMapper.toResponseList(bookings);
    }

    @Override
    public PageResponse<BookingResponse> getBookingsByCafeId(Long cafeId, Pageable pageable) {
        Page<Booking> page = bookingRepository.findByCafeId(cafeId, pageable);
        return PageResponse.<BookingResponse>builder()
                .content(bookingMapper.toResponseList(page.getContent()))
                .pageNumber(page.getNumber())
                .pageSize(page.getSize())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .build();
    }

    @Override
    public List<BookingResponse> getBookingsByStatus(Long customerId, Booking.BookingStatus status) {
        List<Booking> bookings = bookingRepository.findByCustomerIdAndStatus(customerId, status);
        return bookingMapper.toResponseList(bookings);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new IllegalArgumentException("Booking is already cancelled");
        }

        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed booking");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason("Cancelled by customer");

        booking = bookingRepository.save(booking);
        log.info("Booking cancelled: {}", booking.getBookingNumber());

        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, Booking.BookingStatus status) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        booking.setStatus(status);

        if (status == Booking.BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
        }

        booking = bookingRepository.save(booking);
        log.info("Booking {} status updated to {}", booking.getBookingNumber(), status);

        return bookingMapper.toResponse(booking);
    }

    private boolean hasBookingConflict(Long tableId, LocalDate bookingDate, LocalTime bookingTime) {
        List<Booking> existingBookings = bookingRepository.findByTableIdAndBookingDate(tableId, bookingDate);

        // Check for time conflicts (assuming 2-hour booking slots)
        LocalTime startTime = bookingTime;
        LocalTime endTime = bookingTime.plusHours(2);

        return existingBookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                .anyMatch(existing -> {
                    LocalTime existingStart = existing.getBookingTime();
                    LocalTime existingEnd = existingStart.plusHours(2);
                    return timeOverlaps(startTime, endTime, existingStart, existingEnd);
                });
    }

    private boolean timeOverlaps(LocalTime start1, LocalTime end1, LocalTime start2, LocalTime end2) {
        return !start1.isAfter(end2) && !start2.isAfter(end1);
    }

    @Override
    public boolean isTableAvailable(Long tableId, LocalDateTime bookingTime) {
        LocalDate bookingDate = bookingTime.toLocalDate();
        LocalTime time = bookingTime.toLocalTime();

        List<Booking> existingBookings = bookingRepository.findByTableIdAndBookingDate(tableId, bookingDate);

        LocalTime startTime = time;
        LocalTime endTime = time.plusHours(2);

        return existingBookings.stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.CONFIRMED)
                .noneMatch(existing -> {
                    LocalTime existingStart = existing.getBookingTime();
                    LocalTime existingEnd = existingStart.plusHours(2);
                    return timeOverlaps(startTime, endTime, existingStart, existingEnd);
                });
    }
}
