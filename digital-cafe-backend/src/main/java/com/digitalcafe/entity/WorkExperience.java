package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

import java.time.LocalDate;

/**
 * Work experience entity for user profiles.
 * Optional field for profile completion.
 */
@Entity
@Table(name = "work_experiences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WorkExperience extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "profile_id", nullable = false)
    private Profile profile;

    @Column(name = "company_name", nullable = false, length = 200)
    private String companyName;

    @Column(name = "position", nullable = false, length = 100)
    private String position;

    @Column(name = "designation", nullable = false, length = 100)
    private String designation;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "is_current", nullable = false)
    @Builder.Default
    private Boolean isCurrent = false;

    @Column(name = "ctc_amount")
    private Double ctcAmount;

    @Column(name = "ctc_currency", length = 10)
    @Builder.Default
    private String ctcCurrency = "INR";

    @Column(name = "reason_for_leaving", columnDefinition = "TEXT")
    private String reasonForLeaving;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "responsibilities", columnDefinition = "TEXT")
    private String responsibilities;
}
