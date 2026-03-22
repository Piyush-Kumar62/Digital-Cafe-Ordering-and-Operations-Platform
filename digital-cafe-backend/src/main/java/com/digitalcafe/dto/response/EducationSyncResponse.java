package com.digitalcafe.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EducationSyncResponse {
    private int totalFetched;
    private int inserted;
    private int skipped;
    private int pages;
}
