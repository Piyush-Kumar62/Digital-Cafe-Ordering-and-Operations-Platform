package com.digitalcafe.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;

@Entity
@Table(name = "education_import_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class EducationImportJob extends BaseEntity {

    public enum ImportType {
        INSTITUTIONS,
        DEGREES,
        BRANCHES
    }

    public enum Status {
        PENDING,
        RUNNING,
        COMPLETED,
        FAILED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "import_type", nullable = false, length = 30)
    private ImportType importType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private Status status;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "total_rows")
    private Integer totalRows;

    @Column(name = "inserted_rows")
    private Integer insertedRows;

    @Column(name = "skipped_rows")
    private Integer skippedRows;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "error_details", columnDefinition = "TEXT")
    private String errorDetails;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "finished_at")
    private LocalDateTime finishedAt;
}
