package com.digitalcafe.repository;

import com.digitalcafe.entity.Booking;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for Booking entity operations.
 * Includes queries for conflict detection and booking management.
 */
@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {

    /**
     * Finds a booking by booking number.
     */
    Optional<Booking> findByBookingNumber(String bookingNumber);

    /**
     * Finds all bookings for a customer.
     */
    List<Booking> findByCustomerId(Long customerId);
    Page<Booking> findByCustomerId(Long customerId, Pageable pageable);

    /**
     * Finds all bookings for a cafe.
     */
    List<Booking> findByCafeId(Long cafeId);
    Page<Booking> findByCafeId(Long cafeId, Pageable pageable);

    /**
     * Finds bookings for a specific table.
     */
    List<Booking> findByTableId(Long tableId);

    /**
     * Finds bookings by date and cafe.
     */
    List<Booking> findByCafeIdAndBookingDate(Long cafeId, LocalDate bookingDate);

    /**
     * Finds bookings by table and date.
     */
    List<Booking> findByTableIdAndBookingDate(Long tableId, LocalDate bookingDate);

    /**
     * Finds bookings by status.
     */
    List<Booking> findByStatus(Booking.BookingStatus status);

    /**
     * Finds bookings by customer and status.
     */
    List<Booking> findByCustomerIdAndStatus(Long customerId, Booking.BookingStatus status);

    /**
     * Checks for conflicting bookings (same table, date, and overlapping time).
     */
    @Query("SELECT COUNT(b) > 0 FROM Booking b WHERE b.table.id = :tableId AND " +
           "b.bookingDate = :bookingDate AND b.bookingTime = :bookingTime AND " +
           "b.status NOT IN ('CANCELLED', 'COMPLETED', 'NO_SHOW')")
    boolean existsConflictingBooking(
            @Param("tableId") Long tableId,
            @Param("bookingDate") LocalDate bookingDate,
            @Param("bookingTime") LocalTime bookingTime
    );

    /**
     * Finds active bookings for a customer.
     */
    @Query("SELECT b FROM Booking b WHERE b.customer.id = :customerId AND " +
           "b.status IN ('PENDING', 'CONFIRMED', 'CHECKED_IN') " +
           "ORDER BY b.bookingDate DESC, b.bookingTime DESC")
    List<Booking> findActiveBookingsByCustomer(@Param("customerId") Long customerId);

    /**
     * Finds upcoming bookings for a cafe.
     */
    @Query("SELECT b FROM Booking b WHERE b.cafe.id = :cafeId AND " +
           "b.bookingDate >= :fromDate AND " +
           "b.status IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY b.bookingDate ASC, b.bookingTime ASC")
    List<Booking> findUpcomingBookingsByCafe(
            @Param("cafeId") Long cafeId,
            @Param("fromDate") LocalDate fromDate
    );

    /**
     * Finds upcoming bookings for a cafe with pagination.
     */
    @Query("SELECT b FROM Booking b WHERE b.cafe.id = :cafeId AND " +
           "b.bookingDate >= :fromDate AND " +
           "b.status IN ('PENDING', 'CONFIRMED') " +
           "ORDER BY b.bookingDate ASC, b.bookingTime ASC")
    Page<Booking> findUpcomingBookingsByCafe(
            @Param("cafeId") Long cafeId,
            @Param("fromDate") LocalDate fromDate,
            Pageable pageable
    );

    /**
     * Counts bookings by status for a cafe.
     */
    long countByCafeIdAndStatus(Long cafeId, Booking.BookingStatus status);

    /**
     * Counts bookings for a specific date and cafe.
     */
    long countByCafeIdAndBookingDate(Long cafeId, LocalDate bookingDate);

    /**
     * Counts bookings for a specific date, cafe, and status.
     */
    long countByCafeIdAndBookingDateAndStatus(Long cafeId, LocalDate bookingDate, Booking.BookingStatus status);
}
