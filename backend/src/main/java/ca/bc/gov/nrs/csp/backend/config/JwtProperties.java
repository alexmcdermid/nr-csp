package ca.bc.gov.nrs.csp.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "security.jwt")
public record JwtProperties(String jwksUri, String issuer, String clientId) {}
