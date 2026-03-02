package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

/**
 * Cafe entity representing individual cafe establishments.
 * Managed by Cafe Owners who can have staff (Chef, Waiter).
 */
@Entity
@Table(name = "cafes", indexes = {
        @Index(name = "idx_cafe_name", columnList = "name"),
        @Index(name = "idx_cafe_owner", columnList = "owner_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Cafe extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "address", nullable = false, length = 300)
    private String address;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "pincode", nullable = false, length = 10)
    private String pincode;

    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Column(name = "email", length = 100)
    private String email;

    @Column(name = "open_time", length = 10)
    private String openTime;   // stored as HH:MM — use getOpenTime() / setOpenTime()

    @Column(name = "close_time", length = 10)
    private String closeTime;  // stored as HH:MM — use getCloseTime() / setCloseTime()

    @Column(name = "logo_url", length = 255)
    private String logoUrl;

    @Column(name = "cover_url", length = 255)
    private String coverUrl;

    @Column(name = "fssai_number", length = 50)
    private String fssaiNumber;

    @Column(name = "gst_number", length = 30)
    private String gstNumber;

    @Column(name = "msme_number", length = 30)
    private String msmeNumber;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "rating")
    private Double rating;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CafeTable> tables = new ArrayList<>();

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<MenuItem> menuItems = new ArrayList<>();

    @OneToMany(mappedBy = "cafe", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<CafeGallery> galleryImages = new ArrayList<>();

    /**
     * Adds a table to the cafe.
     */
    public void addTable(CafeTable table) {
        tables.add(table);
        table.setCafe(this);
    }

    /**
     * Adds a menu item to the cafe.
     */
    public void addMenuItem(MenuItem menuItem) {
        menuItems.add(menuItem);
        menuItem.setCafe(this);
    }
}
