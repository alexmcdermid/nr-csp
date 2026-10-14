package ca.bc.gov.nrs.csp.backend.config;

import ca.bc.gov.nrs.csp.backend.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers.springSecurity;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(SpringExtension.class)
@ContextConfiguration(classes = { SecurityConfig.class, SecurityConfigTest.TestWebConfig.class })
@WebAppConfiguration
@TestPropertySource(properties = {
        "security.jwt.jwks-uri=https://test.example.com/.well-known/jwks.json",
        "security.jwt.issuer=test-issuer",
        "security.jwt.client-id=test-audience"
})
class SecurityConfigTest {

    // Spring auto-registers the nested @RestController when it processes this @Configuration.
    // No @Bean factory method needed — adding one would register it twice.
    @Configuration
    @EnableWebMvc
    static class TestWebConfig {

        @RestController
        static class TestController {
            @GetMapping("/api/health") String health() { return "ok"; }
            @GetMapping("/api/some-endpoint") String endpoint() { return "ok"; }
            @GetMapping("/api/swagger-ui/index.html") String swagger() { return "swagger"; }
        }
    }

    @Autowired
    private WebApplicationContext context;

    @MockitoBean
    private JwtService jwtService;

    private MockMvc mockMvc;

    @BeforeEach
    void setup() {
        mockMvc = MockMvcBuilders
                .webAppContextSetup(context)
                .apply(springSecurity())
                .build();
    }

    @Test
    void unauthenticatedRequestToHealthEndpoint_isOk() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk());
    }

    @Test
    void unauthenticatedRequestToApiEndpoint_isUnauthorized() throws Exception {
        mockMvc.perform(get("/api/some-endpoint"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(authorities = "VIEW")
    void authenticatedRequestToApiEndpoint_isOk() throws Exception {
        mockMvc.perform(get("/api/some-endpoint"))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(authorities = "OTHER_APP_ADMIN")
    void authenticatedWithoutCspRole_isForbidden() throws Exception {
        mockMvc.perform(get("/api/some-endpoint")).andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestToSwaggerUi_isOk() throws Exception {
        mockMvc.perform(get("/api/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }

    @Test
    void response_hasContentSecurityPolicyHeader() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(header().string("Content-Security-Policy",
                        containsString("default-src 'self'")));
    }

    // This service must NOT set HSTS, even on a request it considers secure. HSTS is a transport
    // policy owned by the edge-facing layer (frontend/Caddyfile); this service terminates no TLS and
    // has no Route, so a second copy here only ever reached the browser as the duplicate
    // Strict-Transport-Security header a ZAP scan flagged. The proxy cannot strip it without also
    // removing its own value, so the fix has to hold here. See the note in SecurityConfig.
    //
    // `.secure(true)` is the condition that used to produce it: in the cluster,
    // `forward-headers-strategy: framework` makes a request carrying X-Forwarded-Proto: https look
    // secure to Spring. Asserting under that condition is what makes this a real regression guard —
    // a plain request would pass even if HSTS came back.
    @Test
    void response_doesNotSetStrictTransportSecurity_evenWhenRequestIsSecure() throws Exception {
        mockMvc.perform(get("/api/health").secure(true))
                .andExpect(header().doesNotExist("Strict-Transport-Security"));
    }

    @Test
    void response_hasXFrameOptionsDeny() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(header().string("X-Frame-Options", "DENY"));
    }
}
