package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.experimental.SuperBuilder;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * User profile information entity.
 * Profile completion is mandatory for system access.
 */
@Entity
@Table(name = "profiles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Profile extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(name = "first_name", nullable = false, length = 50)
    private String firstName;

    @Column(name = "last_name", nullable = false, length = 50)
    private String lastName;

    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Enumerated(EnumType.STRING)
    @Column(name = "gender", length = 20)
    private Gender gender;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "profile_picture_url")
    private String profilePictureUrl;

    @OneToOne(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    private Address address;

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<AcademicInfo> academicInformation = new ArrayList<>();

    @OneToMany(mappedBy = "profile", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<WorkExperience> workExperiences = new ArrayList<>();

    @Enumerated(EnumType.STRING)
    @Column(name = "marital_status", length = 20)
    private MaritalStatus maritalStatus;

    public enum Gender {
        MALE,
        FEMALE,
        OTHER,
        PREFER_NOT_TO_SAY
    }

    public enum MaritalStatus {
        SINGLE,
        MARRIED,
        DIVORCED,
        WIDOWED
    }

    /**
     * Calculates profile completion percentage based on filled fields.
     */
    public int calculateCompletionPercentage() {
        int totalFields = 8; // firstName, lastName, dob, gender, phone, address, academic (at least 1)
        int filledFields = 0;

        if (firstName != null && !firstName.isBlank()) filledFields++;
        if (lastName != null && !lastName.isBlank()) filledFields++;
        if (dateOfBirth != null) filledFields++;
        if (gender != null) filledFields++;
        if (phoneNumber != null && !phoneNumber.isBlank()) filledFields++;
        if (address != null && address.isComplete()) filledFields++;
        if (academicInformation != null && !academicInformation.isEmpty()) filledFields++;

        return (filledFields * 100) / totalFields;
    }

    /**
     * Checks if profile is complete enough for system access.
     */
    public boolean isComplete() {
        return calculateCompletionPercentage() >= 85; // Minimum 85% to be considered complete
    }

    public String getFullName() {
        return firstName + " " + lastName;
    }
}
