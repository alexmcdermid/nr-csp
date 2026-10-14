package ca.bc.gov.nrs.csp.backend.service;

import ca.bc.gov.nrs.csp.backend.config.JwtProperties;
import com.auth0.jwk.Jwk;
import com.auth0.jwk.JwkProvider;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class JwtServiceTest {
    private static final String ISSUER = "https://sso.example.test/auth/realms/standard";
    private static final String CLIENT = "csp-browser";
    private KeyPair keyPair;
    private JwtService service;

    @BeforeEach void setup() throws Exception {
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        keyPair = gen.generateKeyPair();
        Jwk key = mock(Jwk.class);
        when(key.getPublicKey()).thenReturn(keyPair.getPublic());
        JwkProvider keys = mock(JwkProvider.class);
        when(keys.get("test-key")).thenReturn(key);
        service = new JwtService(new JwtProperties("", ISSUER, CLIENT));
        ReflectionTestUtils.setField(service, "provider", keys);
    }

    private Map<String,Object> claims() {
        Map<String,Object> c = new HashMap<>();
        c.put("iss", ISSUER); c.put("azp", CLIENT); c.put("typ", "Bearer");
        c.put("exp", new Date(System.currentTimeMillis() + 60_000));
        c.put("sub", "keycloak-user-uuid"); c.put("identity_provider", "azureidir");
        c.put("idir_username", "JSMITH");
        return c;
    }
    private String token(Map<String,Object> claims) {
        return Jwts.builder().header().keyId("test-key").and().claims(claims)
            .signWith(keyPair.getPrivate(), Jwts.SIG.RS256).compact();
    }
    private String tokenWith(String name, Object value) {
        var c = claims(); c.put(name, value); return token(c);
    }
    private List<String> authorities(String token) {
        return service.extractAuthorities(token).stream().map(GrantedAuthority::getAuthority).toList();
    }

    @Test void preservesAuditUsernameRatherThanKeycloakSubject() {
        assertEquals("JSMITH", service.extractUsername(token(claims())));
    }
    @Test void acceptsAccountAudienceWhenAuthorizedPartyIsThisClient() {
        assertEquals("JSMITH", service.extractUsername(tokenWith("aud", List.of("account"))));
    }
    @Test void rejectsForeignClientEvenWithCspRoles() {
        assertThrows(JwtException.class, () -> service.extractAllClaims(tokenWith("azp", "other-client")));
    }
    @Test void rejectsWrongIssuer() {
        assertThrows(JwtException.class, () -> service.extractAllClaims(tokenWith("iss", "https://other.example.test")));
    }
    @Test void rejectsIdRefreshAndServiceAccountTokens() {
        for (String type : List.of("ID", "Refresh", "Offline")) {
            assertThrows(JwtException.class, () -> service.extractAllClaims(tokenWith("typ", type)));
        }
        assertThrows(JwtException.class, () -> service.extractAllClaims(tokenWith("identity_provider", "service-account")));
    }
    @Test void rejectsExpiredAndUndatedTokens() {
        assertThrows(JwtException.class, () -> service.extractAllClaims(tokenWith("exp", new Date(0))));
        var c = claims(); c.remove("exp");
        assertThrows(JwtException.class, () -> service.extractAllClaims(token(c)));
    }
    @Test void rejectsMissingAuditUsernameRatherThanFallingBackToUuid() {
        var c = claims(); c.remove("idir_username");
        assertThrows(JwtException.class, () -> service.extractAllClaims(token(c)));
    }
    @Test void mapsOnlyExactCspStaffRoles() {
        assertEquals(List.of("ADMIN", "VIEW"), authorities(tokenWith("client_roles", List.of(
            " csp_admin ", "CSP_VIEW", "ADMIN", "ILCR_APPROVE", "OTHER_CSP_APPROVE", "FAM:EXPIRES:2099-01-01:CSP_APPROVE"))));
    }
    @Test void resourceRolesAreLimitedToConfiguredClient() {
        assertEquals(List.of("APPROVE"), authorities(tokenWith("resource_access", Map.of(
            CLIENT, Map.of("roles", List.of("CSP_APPROVE")), "other", Map.of("roles", List.of("CSP_ADMIN"))))));
    }
    @Test void businessIdentityCannotInheritStaffAuthority() {
        var c = claims(); c.put("identity_provider", "bceidbusiness"); c.put("bceid_username", "BUSINESS_USER");
        c.put("client_roles", List.of("CSP_ADMIN"));
        assertEquals("BUSINESS_USER", service.extractUsername(token(c)));
        assertTrue(authorities(token(c)).isEmpty());
    }
    @Test void noAppRoleMeansNoAuthority() { assertTrue(authorities(token(claims())).isEmpty()); }
    @Test void alteredSignatureIsRejected() throws Exception {
        var other = KeyPairGenerator.getInstance("RSA").generateKeyPair();
        var forged = Jwts.builder().header().keyId("test-key").and().claims(claims()).signWith(other.getPrivate()).compact();
        assertThrows(JwtException.class, () -> service.extractAllClaims(forged));
    }
    @Test void realAuthRefusesMissingClientConfiguration() {
        var unconfigured = new JwtService(new JwtProperties("", ISSUER, ""));
        assertThrows(IllegalStateException.class, unconfigured::init);
    }
    @Test void localMockDoesNotNeedAProvider() throws Exception {
        var local = new JwtService(new JwtProperties("", "", ""));
        ReflectionTestUtils.setField(local, "mockEnabled", true);
        local.init();
        assertThrows(JwtException.class, () -> local.extractAllClaims("not-a-token"));
    }
}
