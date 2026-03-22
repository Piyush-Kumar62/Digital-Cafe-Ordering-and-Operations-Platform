package com.digitalcafe.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class EducationHealthResponse {
    private long institutionCount;
    private long degreeCount;
    private long branchCount;
    private long degreesMissingBranches;
    private List<String> degreeNamesMissingBranches;
}
