package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

/**
 * Address entity for user profiles.
 * Mandatory for profile completion.
 */
@Entity
@Table(name = "addresses")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Address extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false, unique = true)
    private Profile profile;

    @Column(name = "street", length = 200)
    private String street;

    @Column(name = "plot_number", length = 50)
    private String plotNumber;

    @Column(name = "city", nullable = false, length = 100)
    private String city;

    @Column(name = "state", length = 100)
    private String state;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "pincode", nullable = false, length = 10)
    private String pincode;

    /**
     * Checks if address has all required fields.
     */
    public boolean isComplete() {
        return street != null && !street.isBlank() &&
                city != null && !city.isBlank() &&
                pincode != null && !pincode.isBlank();
    }

    public String getFullAddress() {
        StringBuilder sb = new StringBuilder();
        if (plotNumber != null) sb.append(plotNumber).append(", ");
        if (street != null) sb.append(street).append(", ");
        if (city != null) sb.append(city).append(", ");
        if (state != null) sb.append(state).append(", ");
        if (country != null) sb.append(country).append(" - ");
        if (pincode != null) sb.append(pincode);
        return sb.toString();
    }
}
