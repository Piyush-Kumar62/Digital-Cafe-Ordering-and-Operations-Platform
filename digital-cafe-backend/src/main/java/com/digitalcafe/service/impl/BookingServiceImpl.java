package com.digitalcafe.service.impl;

import com.digitalcafe.dto.request.BookingRequest;
import com.digitalcafe.dto.request.CustomerBookingRequest;
import com.digitalcafe.dto.response.AvailabilityTableResponse;
import com.digitalcafe.dto.response.BookingResponse;
import com.digitalcafe.dto.response.PageResponse;
import com.digitalcafe.entity.Booking;
import com.digitalcafe.entity.Cafe;
import com.digitalcafe.entity.CafeTable;
import com.digitalcafe.entity.User;
import com.digitalcafe.exception.BookingConflictException;
import com.digitalcafe.exception.BusinessException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.mapper.BookingMapper;
import com.digitalcafe.repository.BookingRepository;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.repository.UserRepository;
import com.digitalcafe.service.BookingService;
import com.digitalcafe.service.EmailService;
import com.digitalcafe.websocket.RealtimeNotification;
import com.digitalcafe.websocket.WebSocketNotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Booking service implementation with overlap validation and transactional safety.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {

    private static final long DEFAULT_BOOKING_DURATION_HOURS = 2L;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CafeRepository cafeRepository;
    private final CafeTableRepository tableRepository;
    private final BookingMapper bookingMapper;
    private final SimpMessagingTemplate messagingTemplate;
    private final EmailService emailService;
    private final WebSocketNotificationService webSocketNotificationService;


    @Override
    @Transactional
    public BookingResponse createBooking(Long customerId, BookingRequest request) {
        log.info("Booking creation started: customerId={}, cafeId={}, tableId={}, date={}, time={}",
                customerId, request.getCafeId(), request.getTableId(),
                request.getBookingDate(), request.getBookingTime());

        LocalDateTime requestedDateTime = LocalDateTime.of(request.getBookingDate(), request.getBookingTime());
        if (requestedDateTime.isBefore(LocalDateTime.now())) {
            throw new BusinessException("Booking time slot cannot be in the past");
        }

        User customer = fetchUser(customerId);
        Cafe cafe = fetchCafe(request.getCafeId());
        CafeTable table = fetchTable(request.getTableId());

        validateTableBelongsToCafe(table, cafe.getId());
        validateTableIsAvailable(table);
        validateTableCapacity(table, request.getNumberOfGuests());

        LocalTime startTime = request.getBookingTime();
        LocalTime endTime = startTime.plusHours(DEFAULT_BOOKING_DURATION_HOURS);

        if (bookingRepository.existsOverlappingBooking(table.getId(), request.getBookingDate(), startTime, endTime)) {
            throw new BookingConflictException("Table is already booked for this time slot");
        }

        Booking booking = buildBooking(customer, cafe, table, request, startTime, endTime);
        booking = bookingRepository.save(booking);

        log.info("Booking created: bookingId={}, bookingNumber={}, customerId={}, tableId={}, date={}, slot={}-{}",
                booking.getId(), booking.getBookingNumber(), customerId,
                table.getId(), booking.getBookingDate(), startTime, endTime);

        emailService.sendBookingConfirmation(customer.getEmail(), buildBookingDetails(booking));
        notifyTableAvailabilityChanged(booking, "BOOKING_CREATED");
        notifyBookingParties(booking, "BOOKING_CONFIRMED", "Booking Confirmed",
            "Your table booking is confirmed for " + booking.getBookingDate() + " at " + booking.getBookingTime() + ".",
            "success");
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse createBooking(Long customerId, CustomerBookingRequest request) {
        log.info("Auto-allocation booking: customerId={}, cafeId={}, date={}, guests={}",
                customerId, request.getCafeId(), request.getDate(), request.getNumberOfGuests());

        LocalDateTime requestedDateTime = LocalDateTime.of(request.getDate(), request.getTimeSlot());
        if (requestedDateTime.isBefore(LocalDateTime.now())) {
            throw new BusinessException("Booking time slot cannot be in the past");
        }

        User customer = fetchUser(customerId);
        Cafe cafe = fetchCafe(request.getCafeId());

        LocalTime startTime = request.getTimeSlot();
        LocalTime endTime = startTime.plusHours(DEFAULT_BOOKING_DURATION_HOURS);

        // Pick the first table that fits capacity and has no time-slot conflict.
        CafeTable table = tableRepository
                .findByCafeIdAndCapacityGreaterThanEqual(cafe.getId(), request.getNumberOfGuests())
                .stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsAvailable()))
                .filter(t -> !bookingRepository.existsOverlappingBooking(
                        t.getId(), request.getDate(), startTime, endTime))
                .findFirst()
                .orElseThrow(() -> new BookingConflictException(
                        "No available tables for " + request.getNumberOfGuests() +
                        " guests at " + request.getDate() + " " + startTime));

        Booking booking = buildBookingFromCustomerRequest(customer, cafe, table, request, startTime, endTime);
        booking = bookingRepository.save(booking);

        log.info("Auto-allocation booking created: bookingId={}, tableId={}", booking.getId(), table.getId());
        emailService.sendBookingConfirmation(customer.getEmail(), buildBookingDetails(booking));
        notifyTableAvailabilityChanged(booking, "BOOKING_CREATED");
        notifyBookingParties(booking, "BOOKING_CONFIRMED", "Booking Confirmed",
            "Your table booking is confirmed for " + booking.getBookingDate() + " at " + booking.getBookingTime() + ".",
            "success");
        return bookingMapper.toResponse(booking);
    }


    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingById(Long bookingId) {
        return bookingMapper.toResponse(fetchBooking(bookingId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByCustomerId(Long customerId) {
        return bookingMapper.toResponseList(bookingRepository.findByCustomerId(customerId));
    }

    @Override
    @Transactional(readOnly = true)
    public List<BookingResponse> getAllBookings() {
        return bookingMapper.toResponseList(bookingRepository.findAll());
    }

    @Override
    @Transactional(readOnly = true)
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
    @Transactional(readOnly = true)
    public List<BookingResponse> getBookingsByStatus(Long customerId, Booking.BookingStatus status) {
        return bookingMapper.toResponseList(bookingRepository.findByCustomerIdAndStatus(customerId, status));
    }

    @Override
    @Transactional(readOnly = true)
    public List<AvailabilityTableResponse> getAvailableTablesForSlot(Long cafeId, LocalDate date,
                                                                      LocalTime time, Integer seatsRequired) {
        LocalTime endTime = time.plusHours(DEFAULT_BOOKING_DURATION_HOURS);
        return tableRepository.findByCafeIdAndCapacityGreaterThanEqual(cafeId, seatsRequired)
                .stream()
                .filter(t -> Boolean.TRUE.equals(t.getIsAvailable()))
                .map(t -> AvailabilityTableResponse.builder()
                        .tableId(t.getId())
                        .capacity(t.getCapacity())
                        .isAvailable(!bookingRepository.existsOverlappingBooking(t.getId(), date, time, endTime))
                        .build())
                .collect(Collectors.toList());
    }


    @Override
    @Transactional
    public BookingResponse cancelBooking(Long bookingId) {
        Booking booking = fetchBooking(bookingId);

        if (booking.getStatus() == Booking.BookingStatus.CANCELLED) {
            throw new BusinessException("Booking is already cancelled");
        }
        if (booking.getStatus() == Booking.BookingStatus.COMPLETED) {
            throw new BusinessException("Cannot cancel a completed booking");
        }

        booking.setStatus(Booking.BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());
        booking.setCancellationReason("Cancelled by customer");
        booking = bookingRepository.save(booking);

        log.info("Booking cancelled: bookingId={}, bookingNumber={}", booking.getId(), booking.getBookingNumber());
        emailService.sendBookingCancelledEmail(booking.getCustomer().getEmail(), buildBookingDetails(booking));
        notifyTableAvailabilityChanged(booking, "BOOKING_CANCELLED");
        notifyBookingParties(booking, "BOOKING_CANCELLED", "Booking Cancelled",
            "Booking " + booking.getBookingNumber() + " has been cancelled.", "warning");
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse updateBookingStatus(Long bookingId, Booking.BookingStatus status) {
        Booking booking = fetchBooking(bookingId);
        Booking.BookingStatus previousStatus = booking.getStatus();
        if (previousStatus == status) {
            log.info("Booking status unchanged; skipping notification email: bookingId={}, status={}", booking.getId(), status);
            return bookingMapper.toResponse(booking);
        }

        booking.setStatus(status);
        if (status == Booking.BookingStatus.CANCELLED) {
            booking.setCancelledAt(LocalDateTime.now());
        }
        booking = bookingRepository.save(booking);
        sendStatusEmailIfActionable(booking, status);
        log.info("Booking status updated: bookingId={}, bookingNumber={}, newStatus={}",
                booking.getId(), booking.getBookingNumber(), status);
        notifyTableAvailabilityChanged(booking, "BOOKING_STATUS_UPDATED");
        notifyBookingParties(booking, "BOOKING_STATUS_UPDATED", "Booking Status Updated",
            "Booking " + booking.getBookingNumber() + " status changed to " + status + ".",
            status == Booking.BookingStatus.CANCELLED ? "warning" : "info");
        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isTableAvailable(Long tableId, LocalDateTime bookingDateTime) {
        LocalDate date = bookingDateTime.toLocalDate();
        LocalTime start = bookingDateTime.toLocalTime();
        LocalTime end = start.plusHours(DEFAULT_BOOKING_DURATION_HOURS);
        return !bookingRepository.existsOverlappingBooking(tableId, date, start, end);
    }


    private Booking fetchBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingId));
    }

    private User fetchUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found: " + userId));
    }

    private Cafe fetchCafe(Long cafeId) {
        return cafeRepository.findById(cafeId)
                .orElseThrow(() -> new ResourceNotFoundException("Cafe not found: " + cafeId));
    }

    private CafeTable fetchTable(Long tableId) {
        return tableRepository.findById(tableId)
                .orElseThrow(() -> new ResourceNotFoundException("Table not found: " + tableId));
    }

    private void validateTableBelongsToCafe(CafeTable table, Long cafeId) {
        if (!table.getCafe().getId().equals(cafeId)) {
            throw new BusinessException("Table " + table.getId() + " does not belong to cafe " + cafeId);
        }
    }

    private void validateTableIsAvailable(CafeTable table) {
        if (!Boolean.TRUE.equals(table.getIsAvailable())) {
            throw new BusinessException("Table " + table.getId() + " is not available for booking");
        }
    }

    private void validateTableCapacity(CafeTable table, Integer guests) {
        if (table.getCapacity() < guests) {
            throw new BusinessException("Table capacity (" + table.getCapacity() +
                    ") is insufficient for " + guests + " guests");
        }
    }

    private Booking buildBooking(User customer, Cafe cafe, CafeTable table,
                                  BookingRequest request, LocalTime startTime, LocalTime endTime) {
        Booking booking = new Booking();
        booking.setBookingNumber("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setCustomer(customer);
        booking.setCafe(cafe);
        booking.setTable(table);
        booking.setBookingDate(request.getBookingDate());
        booking.setBookingTime(request.getBookingTime());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setNumberOfGuests(request.getNumberOfGuests());
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        return booking;
    }

    private Booking buildBookingFromCustomerRequest(User customer, Cafe cafe, CafeTable table,
                                                     CustomerBookingRequest request,
                                                     LocalTime startTime, LocalTime endTime) {
        Booking booking = new Booking();
        booking.setBookingNumber("BKG-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setCustomer(customer);
        booking.setCafe(cafe);
        booking.setTable(table);
        booking.setBookingDate(request.getDate());
        booking.setBookingTime(request.getTimeSlot());
        booking.setStartTime(startTime);
        booking.setEndTime(endTime);
        booking.setNumberOfGuests(request.getNumberOfGuests());
        booking.setStatus(Booking.BookingStatus.CONFIRMED);
        return booking;
    }

    private void notifyTableAvailabilityChanged(Booking booking, String eventType) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("eventType", eventType);
            payload.put("type", eventType);
            payload.put("title", "Table Availability Updated");
            payload.put("message", "Booking " + booking.getBookingNumber() + " is now " + booking.getStatus() + ".");
            payload.put("bookingId", booking.getId());
            payload.put("cafeId", booking.getCafe().getId());
            payload.put("tableId", booking.getTable().getId());
            payload.put("bookingDate", booking.getBookingDate().toString());
            payload.put("bookingTime", booking.getBookingTime().toString());
            payload.put("status", booking.getStatus().name());
            payload.put("timestamp", LocalDateTime.now().toString());
            messagingTemplate.convertAndSend("/topic/cafe/" + booking.getCafe().getId() + "/tables", payload);
        } catch (Exception e) {
            log.warn("Failed to publish table availability update for bookingId={}: {}", booking.getId(), e.getMessage());
        }
    }

    private void notifyBookingParties(Booking booking, String type, String title, String message, String severity) {
        LocalDateTime now = LocalDateTime.now();

        try {
            if (booking.getCustomer() != null) {
                webSocketNotificationService.notifyUser(
                        booking.getCustomer().getId(),
                        RealtimeNotification.builder()
                                .type(type)
                                .title(title)
                                .message(message)
                                .severity(severity)
                                .entityType("BOOKING")
                                .entityId(booking.getId())
                                .timestamp(now)
                                .build()
                );
            }

            if (booking.getCafe() != null && booking.getCafe().getOwner() != null) {
                webSocketNotificationService.notifyUser(
                        booking.getCafe().getOwner().getId(),
                        RealtimeNotification.builder()
                                .type(type)
                                .title("Cafe Booking Update")
                                .message("Booking " + booking.getBookingNumber() + " for " + booking.getNumberOfGuests() +
                                        " guests is now " + booking.getStatus() + ".")
                                .severity(severity)
                                .entityType("BOOKING")
                                .entityId(booking.getId())
                                .timestamp(now)
                                .build()
                );
            }

            webSocketNotificationService.notifyAdmins(
                    RealtimeNotification.builder()
                            .type(type)
                            .title("Booking Update")
                            .message("Booking " + booking.getBookingNumber() + " is now " + booking.getStatus() + ".")
                            .severity(severity)
                            .entityType("BOOKING")
                            .entityId(booking.getId())
                            .timestamp(now)
                            .build()
            );
        } catch (Exception ex) {
            log.warn("Failed to notify booking parties for bookingId={}: {}", booking.getId(), ex.getMessage());
        }
    }

    private String buildBookingDetails(Booking booking) {
        String tableInfo = booking.getTable() != null ? booking.getTable().getTableNumber() : "-";
        String cafeName = booking.getCafe() != null ? booking.getCafe().getName() : "-";
        return String.format(
            "Booking Number: %s\nStatus: %s\nCafe: %s\nTable: %s\nDate: %s\nTime: %s - %s\nGuests: %d",
                booking.getBookingNumber(),
            booking.getStatus(),
                cafeName,
                tableInfo,
                booking.getBookingDate(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getNumberOfGuests());
    }

    private void sendStatusEmailIfActionable(Booking booking, Booking.BookingStatus status) {
        String customerEmail = booking.getCustomer() != null ? booking.getCustomer().getEmail() : null;
        if (customerEmail == null || customerEmail.isBlank()) {
            return;
        }

        switch (status) {
            case CANCELLED -> emailService.sendBookingCancelledEmail(customerEmail, buildBookingDetails(booking));
            case CONFIRMED, BOOKED -> emailService.sendBookingConfirmation(customerEmail, buildBookingDetails(booking));
            default -> {
                // Keep silent for PENDING/CHECKED_IN/COMPLETED/NO_SHOW.
            }
        }
    }
}
