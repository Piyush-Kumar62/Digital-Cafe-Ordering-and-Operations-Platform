package com.digitalcafe.service;

import com.digitalcafe.dto.response.PostalLookupResponseDTO;

public interface PostalLookupService {
    PostalLookupResponseDTO lookup(String pin);
}
