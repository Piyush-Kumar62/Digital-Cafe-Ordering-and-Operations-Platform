package com.digitalcafe.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenAPIConfig {

    private static final Logger logger = LoggerFactory.getLogger(OpenAPIConfig.class);

    @Bean
    public OpenAPI defineOpenAPI() {
        Server server = new Server();
        server.setUrl("http://localhost:8080");
        server.setDescription("Development");

        Info info = new Info()
                .title("Digital Cafe Ordering and Operations Platform")
                .version("1.0")
                .description("This API exposes endpoints to manage a digital cafe.");

        final String securitySchemeName = "bearerAuth";

        OpenAPI openAPI = new OpenAPI()
                .info(info)
                .servers(List.of(server))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(
                        new Components()
                                .addSecuritySchemes(securitySchemeName,
                                        new SecurityScheme()
                                                .name(securitySchemeName)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );

        try {
            String json = new ObjectMapper().writeValueAsString(openAPI);
            logger.info("Generated OpenAPI spec: {}", json);
        } catch (JsonProcessingException e) {
            logger.error("Could not serialize OpenAPI spec", e);
        }

        return openAPI;
    }
}
