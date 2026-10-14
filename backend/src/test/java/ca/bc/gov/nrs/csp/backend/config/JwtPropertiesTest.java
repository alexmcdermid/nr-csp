package ca.bc.gov.nrs.csp.backend.config;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JwtPropertiesTest {

    @Test
    void record_exposesAllComponents() {
        JwtProperties properties = new JwtProperties(
                "https://sso.example.com/.well-known/jwks.json",
                "https://sso.example.com/auth/realms/standard",
                "csp-audience");

        assertThat(properties.jwksUri()).isEqualTo("https://sso.example.com/.well-known/jwks.json");
        assertThat(properties.issuer()).isEqualTo("https://sso.example.com/auth/realms/standard");
        assertThat(properties.clientId()).isEqualTo("csp-audience");
    }

    @Test
    void record_equalsAndHashCode_basedOnComponents() {
        JwtProperties a = new JwtProperties("uri", "issuer", "audience");
        JwtProperties b = new JwtProperties("uri", "issuer", "audience");
        JwtProperties different = new JwtProperties("uri", "issuer", "other-audience");

        assertThat(a)
                .isEqualTo(b)
                .hasSameHashCodeAs(b)
                .isNotEqualTo(different);
    }

    @Test
    void record_toString_containsComponentValues() {
        JwtProperties properties = new JwtProperties("uri", "issuer", "audience");

        assertThat(properties.toString())
                .contains("uri")
                .contains("issuer")
                .contains("audience");
    }
}
