package com.digitalcafe.service.impl;

import com.digitalcafe.dto.response.EducationSyncResponse;
import com.digitalcafe.entity.Institution;
import com.digitalcafe.exception.BadRequestException;
import com.digitalcafe.repository.InstitutionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.ArrayList;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DataGovInstitutionSyncService {

    private final InstitutionRepository institutionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${data.gov.api.key:}")
    private String apiKey;

    @Value("${data.gov.resource.id:}")
    private String resourceId;

    @Value("${data.gov.api.base-url:https://api.data.gov.in/resource/}")
    private String baseUrl;

    @Value("${data.gov.api.page-size:100}")
    private int pageSize;

    @Value("${data.gov.api.max-records:0}")
    private int maxRecords;

    @Value("${data.gov.columns.name:}")
    private String nameColumn;

    @Value("${data.gov.columns.city:}")
    private String cityColumn;

    @Value("${data.gov.columns.state:}")
    private String stateColumn;

    @Transactional
    public EducationSyncResponse syncInstitutions() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new BadRequestException("DATA_GOV_API_KEY is not configured");
        }
        if (resourceId == null || resourceId.isBlank()) {
            throw new BadRequestException("DATA_GOV_RESOURCE_ID is not configured");
        }

        int offset = 0;
        int fetched = 0;
        int inserted = 0;
        int skipped = 0;
        int pages = 0;

        while (true) {
            String url = UriComponentsBuilder
                    .fromHttpUrl(baseUrl + resourceId)
                    .queryParam("api-key", apiKey)
                    .queryParam("format", "json")
                    .queryParam("limit", pageSize)
                    .queryParam("offset", offset)
                    .toUriString();

            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            JsonNode root;
            try {
                root = objectMapper.readTree(response.getBody());
            } catch (Exception ex) {
                throw new BadRequestException("Unable to parse data.gov.in response");
            }

            JsonNode records = root.path("records");
            if (!records.isArray() || records.size() == 0) {
                break;
            }

            pages++;
            List<Institution> batch = new ArrayList<>();
            for (JsonNode record : records) {
                String name = normalizeName(readField(
                        record,
                        nameColumn,
                        "college_name",
                        "university_name",
                        "institution",
                        "institution_name",
                        "name",
                        "hei_name"
                ));
                String city = normalizeName(readField(record, cityColumn, "city", "district", "district_name", "town", "location"));
                String state = normalizeName(readField(record, stateColumn, "state", "state_ut", "state/ut", "state_name"));

                if (name.isEmpty()) {
                    skipped++;
                    continue;
                }

                String finalCity = city.isEmpty() ? null : city;
                String finalState = state.isEmpty() ? null : state;
                if (institutionRepository.existsByNameCityStateIgnoreCase(name, finalCity, finalState)) {
                    skipped++;
                    continue;
                }
                batch.add(Institution.builder().name(name).city(finalCity).state(finalState).build());
                inserted++;
            }

            if (!batch.isEmpty()) {
                institutionRepository.saveAll(batch);
            }

            fetched += records.size();
            offset += pageSize;
            if (records.size() < pageSize) {
                break;
            }
            if (maxRecords > 0 && fetched >= maxRecords) {
                break;
            }
        }

        log.info("Data.gov.in sync completed. fetched={}, inserted={}, skipped={}, pages={}", fetched, inserted, skipped, pages);
        return EducationSyncResponse.builder()
                .totalFetched(fetched)
                .inserted(inserted)
                .skipped(skipped)
                .pages(pages)
                .build();
    }

    private String readField(JsonNode node, String preferred, String... fallbacks) {
        if (preferred != null && !preferred.isBlank()) {
            JsonNode preferredNode = node.get(preferred);
            if (preferredNode != null && !preferredNode.isNull()) {
                return preferredNode.asText("");
            }
        }
        for (String key : fallbacks) {
            JsonNode value = node.get(key);
            if (value != null && !value.isNull()) {
                return value.asText("");
            }
        }
        return "";
    }

    private static String normalizeName(String value) {
        if (value == null) return "";
        return value.replaceAll("\\s+", " ").trim();
    }
}
