package com.digitalcafe.service.impl;

import com.digitalcafe.dto.response.PostalLookupResponseDTO;
import com.digitalcafe.service.PostalLookupService;
import lombok.Data;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Service
public class PostalLookupServiceImpl implements PostalLookupService {
    private static final List<String> POSTAL_API_URLS = List.of(
            "https://api.postalpincode.in/pincode/",
            "https://postalpincode.in/api/pincode/"
    );
    private static final String NOMINATIM_URL =
            "https://nominatim.openstreetmap.org/search?postalcode={pin}&country=india&format=json&addressdetails=1";
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public PostalLookupResponseDTO lookup(String pin) {
        String normalized = String.valueOf(pin == null ? "" : pin).trim();
        if (!normalized.matches("^[0-9]{6}$")) {
            return PostalLookupResponseDTO.notFound();
        }

        for (String baseUrl : POSTAL_API_URLS) {
            try {
                PostalLookupResponseDTO result = tryLookup(baseUrl, normalized);
                if (result != null) {
                    return result;
                }
            } catch (Exception ignored) {
                // Try next provider
            }
        }
        try {
            PostalLookupResponseDTO nominatim = tryNominatim(normalized);
            if (nominatim != null) {
                return nominatim;
            }
        } catch (Exception ignored) {
            // fall through
        }
        return PostalLookupResponseDTO.error();
    }

    private PostalLookupResponseDTO tryLookup(String baseUrl, String pin) {
        PostalApiResponse[] response =
                restTemplate.getForObject(baseUrl + pin, PostalApiResponse[].class);
        if (response == null || response.length == 0) {
            return null;
        }

        PostalApiResponse first = response[0];
        if (first == null || !"Success".equalsIgnoreCase(first.getStatus())) {
            return PostalLookupResponseDTO.notFound();
        }

        List<PostOffice> offices = first.getPostOffice();
        if (offices == null || offices.isEmpty()) {
            return PostalLookupResponseDTO.notFound();
        }

        Set<String> cities = new LinkedHashSet<>();
        Set<String> states = new LinkedHashSet<>();
        for (PostOffice office : offices) {
            if (office == null) continue;
            if (office.getDistrict() != null && !office.getDistrict().isBlank()) {
                cities.add(office.getDistrict());
            }
            if (office.getState() != null && !office.getState().isBlank()) {
                states.add(office.getState());
            }
        }

        return PostalLookupResponseDTO.success(
                List.copyOf(cities),
                List.copyOf(states)
        );
    }

    private PostalLookupResponseDTO tryNominatim(String pin) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("User-Agent", "digital-cafe/1.0");
        HttpEntity<Void> request = new HttpEntity<>(headers);
        var response = restTemplate.exchange(
                NOMINATIM_URL,
                HttpMethod.GET,
                request,
                NominatimResponse[].class,
                pin
        );
        NominatimResponse[] body = response.getBody();
        if (body == null || body.length == 0) {
            return null;
        }
        NominatimResponse first = body[0];
        if (first == null || first.getAddress() == null) {
            return null;
        }
        String city = first.getAddress().resolveCity();
        String state = first.getAddress().getState();
        if ((city == null || city.isBlank()) && (state == null || state.isBlank())) {
            return null;
        }
        Set<String> cities = new LinkedHashSet<>();
        Set<String> states = new LinkedHashSet<>();
        if (city != null && !city.isBlank()) {
            cities.add(city);
        }
        if (state != null && !state.isBlank()) {
            states.add(state);
        }
        return PostalLookupResponseDTO.success(List.copyOf(cities), List.copyOf(states));
    }

    @Data
    private static class PostalApiResponse {
        private String Status;
        private List<PostOffice> PostOffice;

        public String getStatus() {
            return Status;
        }

        public List<PostOffice> getPostOffice() {
            return PostOffice == null ? Collections.emptyList() : PostOffice;
        }
    }

    @Data
    private static class PostOffice {
        private String District;
        private String State;

        public String getDistrict() {
            return District;
        }

        public String getState() {
            return State;
        }
    }

    @Data
    private static class NominatimResponse {
        private NominatimAddress address;
    }

    @Data
    private static class NominatimAddress {
        private String city;
        private String town;
        private String village;
        private String county;
        private String state;

        public String resolveCity() {
            if (city != null && !city.isBlank()) return city;
            if (town != null && !town.isBlank()) return town;
            if (village != null && !village.isBlank()) return village;
            if (county != null && !county.isBlank()) return county;
            return null;
        }
    }
}
