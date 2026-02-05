package com.digitalcafe.repository;

import com.digitalcafe.model.TableBooking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

@Repository
public interface TableBookingRepository extends JpaRepository<TableBooking, Long> {
    List<TableBooking> findByCustomerId(Long customerId);
    List<TableBooking> findByTableId(Long tableId);
    List<TableBooking> findByCafeId(Long cafeId);
    List<TableBooking> findByStatus(TableBooking.BookingStatus status);
    List<TableBooking> findByBookingDate(LocalDate bookingDate);
    List<TableBooking> findByCafeIdAndBookingDateAndStatus(Long cafeId, LocalDate bookingDate, TableBooking.BookingStatus status);

    @Query("SELECT b FROM TableBooking b WHERE b.table.id = :tableId " +
           "AND b.bookingDate = :date AND b.bookingTime = :time " +
           "AND b.status IN ('PENDING', 'CONFIRMED')")
    List<TableBooking> findConflictingBookings(@Param("tableId") Long tableId,
                                                @Param("date") LocalDate date,
                                                @Param("time") LocalTime time);
    
    @Query("SELECT CASE WHEN COUNT(b) > 0 THEN true ELSE false END FROM TableBooking b " +
           "WHERE b.table.id = :tableId AND b.bookingDate = :date AND b.bookingTime = :time " +
           "AND b.status IN ('PENDING', 'CONFIRMED')")
    boolean existsByTableIdAndBookingDateAndBookingTime(@Param("tableId") Long tableId,
                                                         @Param("date") LocalDate date,
                                                         @Param("time") LocalTime time);
}
