package ca.bc.gov.nrs.csp.backend;

import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.mockito.Answers;
import org.springdoc.webmvc.ui.SwaggerWelcomeWebMvc;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Boots the full application context with the Oracle datasource stubbed out.
 *
 * Unit tests never load the Spring context, so a dependency upgrade can pass CI
 * yet crash on deploy while Spring introspects auto-configuration classes
 * (e.g. springdoc 2.8.17 compiled against Spring Boot 3 threw
 * NoClassDefFoundError for WebMvcProperties on Boot 4 at startup). This test
 * fails on that whole class of breakage before it reaches OpenShift.
 *
 * RETURNS_MOCKS lets startup-time DB access (ValidatingDataSource's
 * pre-flight query, ReferenceDataWarmupService) run against empty results
 * instead of a real Oracle connection. security.jwt.jwks-uri needs a
 * well-formed URL because JwtService parses it in @PostConstruct (the
 * provider fetches keys lazily, so nothing is contacted).
 */
@SpringBootTest(properties = {
        "security.jwt.jwks-uri=https://localhost/protocol/openid-connect/certs",
        "security.jwt.issuer=https://localhost/auth/realms/standard",
        "security.jwt.client-id=csp-smoke"
})
class CspApplicationContextSmokeTest {

    @MockitoBean(answers = Answers.RETURNS_MOCKS)
    private HikariDataSource hikariDataSource;

    @Autowired
    private ApplicationContext context;

    @Test
    void contextLoadsAndSwaggerConfigResolves() {
        assertThat(context.getBean(SwaggerWelcomeWebMvc.class)).isNotNull();
    }
}
