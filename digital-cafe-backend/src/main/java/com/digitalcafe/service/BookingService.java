package com.digitalcafe.service;

import com.digitalcafe.dto.BookingDTO;
import com.digitalcafe.dto.BookingRequestDTO;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.exception.ResourceNotFoundException;
import com.digitalcafe.model.Cafe;
import com.digitalcafe.model.CafeTable;
import com.digitalcafe.model.TableBooking;
import com.digitalcafe.model.User;
import com.digitalcafe.repository.CafeRepository;
import com.digitalcafe.repository.CafeTableRepository;
import com.digitalcafe.repository.TableBookingRepository;
import com.digitalcafe.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class BookingService {

    private final TableBookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final CafeTableRepository tableRepository;
    private final CafeRepository cafeRepository;

    @Transactional
    public BookingDTO createBooking(String username, BookingRequestDTO request) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if email is verified and profile is completed
        if (!customer.getEmailVerified()) {
            throw new BadRequestException("Please verify your email before making a booking");
        }
        if (!customer.getProfileCompleted()) {
            throw new BadRequestException("Please complete your profile before making a booking");
        }

        CafeTable table = tableRepository.findById(request.getTableId())
                .orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        if (!table.getActive()) {
            throw new BadRequestException("Table is not active");
        }

        if (table.getStatus() != CafeTable.TableStatus.AVAILABLE) {
            throw new BadRequestException("Table is not available for booking (Status: " + table.getStatus() + ")");
        }

        // Check if table is already booked for the requested time
        LocalDate bookingDate = request.getBookingDateTime().toLocalDate();
        LocalTime bookingTime = request.getBookingDateTime().toLocalTime();

        boolean isBooked = bookingRepository.existsByTableIdAndBookingDateAndBookingTime(
                table.getId(), bookingDate, bookingTime
        );

        if (isBooked) {
            throw new BadRequestException("Table is already booked for this time");
        }

        TableBooking booking = new TableBooking();
        booking.setCustomer(customer);
        booking.setTable(table);
        booking.setCafe(table.getCafe());
        booking.setBookingDate(bookingDate);
        booking.setBookingTime(bookingTime);
        booking.setNumberOfGuests(request.getNumberOfGuests());
        booking.setSpecialRequests(request.getSpecialRequests());
        booking.setStatus(TableBooking.BookingStatus.PENDING);

        booking = bookingRepository.save(booking);

        return convertToDTO(booking);
    }

    public BookingDTO getBookingById(Long id) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        return convertToDTO(booking);
    }

    public List<BookingDTO> getBookingsByCustomer(String username) {
        User customer = userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return bookingRepository.findByCustomerId(customer.getId())
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<BookingDTO> getBookingsByCafe(Long cafeId) {
        return bookingRepository.findByCafeId(cafeId)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void cancelBooking(Long id) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (booking.getStatus() == TableBooking.BookingStatus.CANCELLED) {
            throw new BadRequestException("Booking is already cancelled");
        }

        booking.setStatus(TableBooking.BookingStatus.CANCELLED);
        bookingRepository.save(booking);
    }

    @Transactional
    public void confirmBooking(Long id) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        booking.setStatus(TableBooking.BookingStatus.CONFIRMED);
        bookingRepository.save(booking);
    }

    @Transactional
    public void completeBooking(Long id) {
        TableBooking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        booking.setStatus(TableBooking.BookingStatus.COMPLETED);
        bookingRepository.save(booking);
    }

    private BookingDTO convertToDTO(TableBooking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .customerId(booking.getCustomer().getId())
                .customerName(booking.getCustomer().getProfile() != null ?
                        booking.getCustomer().getProfile().getFirstName() + " " +
                                booking.getCustomer().getProfile().getLastName() :
                        booking.getCustomer().getUsername())
                .cafeId(booking.getCafe().getId())
                .cafeName(booking.getCafe().getName())
                .tableId(booking.getTable().getId())
                .tableNumber(booking.getTable().getTableNumber())
                .bookingDateTime(LocalDateTime.of(booking.getBookingDate(), booking.getBookingTime()))
                .numberOfGuests(booking.getNumberOfGuests())
                .status(booking.getStatus().name())
                .specialRequests(booking.getSpecialRequests())
                .createdAt(booking.getCreatedAt())
                .build();
    }
}
