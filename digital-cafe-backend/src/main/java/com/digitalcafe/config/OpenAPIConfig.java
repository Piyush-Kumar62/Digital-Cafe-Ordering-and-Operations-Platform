package com.digitalcafe.config;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.ExternalDocumentation;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
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

    private static final Logger logger =
            LoggerFactory.getLogger(OpenAPIConfig.class);

    @Bean
    public OpenAPI defineOpenAPI() {

        // Server
        Server server = new Server();
        server.setUrl("http://localhost:8080");
        server.setDescription("Development Environment");

        // Contact (Portfolio only)
        Contact contact = new Contact();
        contact.setName("Piyush Kumar");
        contact.setUrl("https://piyush-kumar.dev");
        contact.setEmail("piyushkumar30066@gmail.com");

        // Short Professional Description
        Info info = new Info()
                .title("Digital Cafe Ordering and Operations Platform API")
                .version("v1.0.0")
                .description("""
## ☕ Digital Cafe Platform API

Secure REST API for managing cafe operations including authentication, table booking, order management, and payments.

### Tech Stack
Spring Boot • Spring Security • JWT • PostgreSQL • WebSocket • Mailtrap
""")
                .contact(contact);

        final String securitySchemeName = "bearerAuth";

        OpenAPI openAPI = new OpenAPI()
                .info(info)
                .servers(List.of(server))

                .addSecurityItem(
                        new SecurityRequirement().addList(securitySchemeName)
                )

                .components(
                        new Components()
                                .addSecuritySchemes(
                                        securitySchemeName,
                                        new SecurityScheme()
                                                .name(securitySchemeName)
                                                .type(SecurityScheme.Type.HTTP)
                                                .scheme("bearer")
                                                .bearerFormat("JWT")
                                )
                );

        try {

            String json =
                    new ObjectMapper()
                            .writeValueAsString(openAPI);

            logger.info("OpenAPI Spec Generated Successfully");

        } catch (JsonProcessingException e) {

            logger.error("Error generating OpenAPI spec", e);
        }

        return openAPI;
    }
}
