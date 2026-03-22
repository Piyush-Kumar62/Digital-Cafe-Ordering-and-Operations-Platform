package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "institutions",
        indexes = {
                @Index(name = "idx_institution_name", columnList = "name"),
                @Index(name = "idx_institution_city", columnList = "city"),
                @Index(name = "idx_institution_state", columnList = "state")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_institution_name_city_state",
                        columnNames = {"name", "city", "state"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Institution extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 255)
    private String name;

    @Column(name = "city", length = 120)
    private String city;

    @Column(name = "state", length = 120)
    private String state;
}
