package ca.bc.gov.nrs.csp.backend.testsupport;

import org.junit.jupiter.api.BeforeAll;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.charset.StandardCharsets;
import java.util.Map;

/**
 * Base for the report-endpoint integration tests: boots the full application against a real
 * Oracle (Testcontainers, gvenzl/oracle-free) loaded with the THE schema, seed data, and stub
 * CSP_SP_RPT_* ref-cursor procedures from {@code db/test-bootstrap.sql}, then exercises the
 * real HTTP stack (security filter chain, validation, JasperReports fill via the PL/SQL query
 * executer, PDF/CSV export).
 *
 * <p>Authentication uses the same {@code auth.mock.enabled} filter the local profile uses, so
 * every request is authenticated as {@code it-user}; JWT properties are set to well-formed
 * placeholder values only so {@code JwtService}'s startup URL parsing succeeds (nothing is
 * fetched).</p>
 *
 * <p>All subclasses share one cached Spring context (identical configuration), so the app and
 * the container boot once per JVM. Skipped entirely when Docker is unavailable.</p>
 */
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = {
                "security.jwt.jwks-uri=https://localhost/.well-known/jwks.json",
                "security.jwt.issuer=https://localhost/test-issuer",
                "security.jwt.client-id=csp-integration-test",
                "auth.mock.enabled=true",
                "auth.mock.username=it-user",
                "auth.mock.roles=ADMIN"
        })
@AutoConfigureTestRestTemplate
public abstract class AbstractReportIT {

    @Autowired
    protected TestRestTemplate rest;

    @BeforeAll
    static void startOracle() {
        RequiresOracle.assumeDockerAvailable();
        OracleTestContainer.start();
        OracleTestContainer.bootstrap();
    }

    @DynamicPropertySource
    static void oracleDatasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", OracleTestContainer::getJdbcUrl);
        registry.add("spring.datasource.username", OracleTestContainer::getUsername);
        registry.add("spring.datasource.password", OracleTestContainer::getPassword);
    }

    protected ResponseEntity<byte[]> postReport(String path, Map<String, Object> body) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return rest.postForEntity(path, new HttpEntity<>(body, headers), byte[].class);
    }

    protected static String asText(ResponseEntity<byte[]> response) {
        return response.getBody() == null ? "" : new String(response.getBody(), StandardCharsets.UTF_8);
    }
}
