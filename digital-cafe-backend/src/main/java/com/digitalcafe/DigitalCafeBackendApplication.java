package com.digitalcafe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ApplicationListener;
import org.springframework.context.annotation.Bean;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.slf4j.MDC;

import com.digitalcafe.util.RequestIdGenerator;

@SpringBootApplication
public class DigitalCafeBackendApplication {

	public static void main(String[] args) {
		MDC.put("requestId", RequestIdGenerator.newShortId());
		SpringApplication.run(DigitalCafeBackendApplication.class, args);
//		System.out.println("==========================================");
//		System.out.println("Digital Cafe Backend is running...");
//		System.out.println("==========================================");
//

  }

	@Bean
	public ApplicationListener<ApplicationReadyEvent> readyEventLogger() {
		return event -> System.out.println("[Startup] ApplicationReadyEvent fired — app is ready.");
	}
}
