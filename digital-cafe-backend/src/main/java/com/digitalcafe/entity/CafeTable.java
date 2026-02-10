package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

/**
 * Cafe table entity for managing table bookings.
 * Each table has capacity and availability tracking.
 */
@Entity
@Table(name = "cafe_tables", indexes = {
        @Index(name = "idx_cafe_table", columnList = "cafe_id, table_number")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CafeTable extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cafe_id", nullable = false)
    private Cafe cafe;

    @Column(name = "table_number", nullable = false, length = 20)
    private String tableNumber;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "is_available", nullable = false)
    @Builder.Default
    private Boolean isAvailable = true;

    @Column(name = "location_description", length = 100)
    private String locationDescription; // e.g., "Window side", "Corner", "Outdoor"

    @Enumerated(EnumType.STRING)
    @Column(name = "table_type", length = 20)
    private TableType tableType;

    public enum TableType {
        REGULAR,
        VIP,
        OUTDOOR,
        PRIVATE
    }

    /**
     * Gets a display name for the table.
     */
    public String getDisplayName() {
        return "Table " + tableNumber + " (" + capacity + " seats)";
    }
}
