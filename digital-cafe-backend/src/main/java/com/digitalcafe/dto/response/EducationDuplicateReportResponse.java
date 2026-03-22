package com.digitalcafe.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EducationDuplicateReportResponse {
    private long institutionDuplicateGroups;
    private long degreeDuplicateGroups;
    private long branchDuplicateGroups;
    private List<DuplicateEntry> institutionSamples;
    private List<DuplicateEntry> degreeSamples;
    private List<DuplicateEntry> branchSamples;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DuplicateEntry {
        private String label;
        private long count;
    }
}
