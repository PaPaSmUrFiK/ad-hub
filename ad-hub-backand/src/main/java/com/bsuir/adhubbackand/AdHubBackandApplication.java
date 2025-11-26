package com.bsuir.adhubbackand;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories(basePackages = "com.bsuir.adhubbackand.repositories")
public class AdHubBackandApplication {

    public static void main(String[] args) {
        SpringApplication.run(AdHubBackandApplication.class, args);
    }

}
