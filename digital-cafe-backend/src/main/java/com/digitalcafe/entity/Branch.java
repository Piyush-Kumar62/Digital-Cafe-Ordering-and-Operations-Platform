package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(
        name = "branches",
        indexes = {
                @Index(name = "idx_branch_name", columnList = "name"),
                @Index(name = "idx_branch_degree", columnList = "degree_id")
        },
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_branch_degree_name",
                        columnNames = {"degree_id", "name"}
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Branch extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 160)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "degree_id", nullable = false)
    private Degree degree;
}
