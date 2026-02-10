package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Booking entity for table reservations.
 * Customers book tables for specific date/time slots.
 * Includes conflict validation and status tracking.
 */
@Entity
@Table(name = "bookings", indexes = {
        @Index(name = "idx_customer_booking", columnList = "customer_id"),
        @Index(name = "idx_cafe_booking", columnList = "cafe_id"),
        @Index(name = "idx_table_booking", columnList = "table_id"),
        @Index(name = "idx_booking_date_time", columnList = "booking_date, booking_time")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Booking extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_number", nullable = false, unique = true, length = 20)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private User customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "table_id", nullable = false)
    private CafeTable table;

    @Column(name = "booking_date", nullable = false)
    private LocalDate bookingDate;

    @Column(name = "booking_time", nullable = false)
    private LocalTime bookingTime;

    @Column(name = "number_of_guests", nullable = false)
    private Integer numberOfGuests;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private BookingStatus status = BookingStatus.PENDING;

    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @OneToOne(mappedBy = "booking", cascade = CascadeType.ALL)
    private Order order;

    public enum BookingStatus {
        PENDING,      // Booking created, awaiting confirmation
        CONFIRMED,    // Booking confirmed
        CHECKED_IN,   // Customer arrived
        COMPLETED,    // Service completed
        CANCELLED,    // Cancelled by customer or system
        NO_SHOW       // Customer didn't show up
    }

    /**
     * Gets the booking date and time as LocalDateTime.
     */
    public LocalDateTime getBookingDateTime() {
        return LocalDateTime.of(bookingDate, bookingTime);
    }

    /**
     * Checks if booking is active (can be used for orders).
     */
    public boolean isActive() {
        return status == BookingStatus.CONFIRMED || status == BookingStatus.CHECKED_IN;
    }

    /**
     * Cancels the booking.
     */
    public void cancel(String reason) {
        this.status = BookingStatus.CANCELLED;
        this.cancelledAt = LocalDateTime.now();
        this.cancellationReason = reason;
    }
}
