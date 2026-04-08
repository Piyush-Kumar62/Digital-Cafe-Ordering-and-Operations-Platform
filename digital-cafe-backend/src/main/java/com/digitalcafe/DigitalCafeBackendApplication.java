package com.digitalcafe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.slf4j.MDC;

import com.digitalcafe.util.RequestIdGenerator;

@SpringBootApplication
public class DigitalCafeBackendApplication {

	public static void main(String[] args) {
		MDC.put("requestId", RequestIdGenerator.newShortId());
		SpringApplication.run(DigitalCafeBackendApplication.class, args);
  }
}
