package ca.bc.gov.nrs.csp.backend.service;

import ca.bc.gov.nrs.csp.backend.config.JwtProperties;
import ca.bc.gov.nrs.csp.backend.exception.JwtSigningKeyException;
import ca.bc.gov.nrs.csp.backend.util.constants.Roles;
import com.auth0.jwk.JwkProvider;
import com.auth0.jwk.JwkProviderBuilder;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import jakarta.annotation.PostConstruct;
import java.net.MalformedURLException;
import java.net.URI;
import java.security.Key;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;

/** Validates CSS access tokens and preserves CSP's existing staff permission contract. */
@Service
public class JwtService {
    private static final Set<String> STAFF_PROVIDERS = Set.of("idir", "azureidir");
    private final JwtProperties jwtProperties;
    private JwkProvider provider;
    @Value("${auth.mock.enabled:false}")
    private boolean mockEnabled;

    public JwtService(JwtProperties jwtProperties) { this.jwtProperties = jwtProperties; }

    @PostConstruct
    public void init() throws MalformedURLException {
        if (mockEnabled) return;
        if (jwtProperties.issuer() == null || jwtProperties.issuer().isBlank()
                || jwtProperties.clientId() == null || jwtProperties.clientId().isBlank()) {
            throw new IllegalStateException("CSP_OIDC_ISSUER_URI and CSP_OIDC_CLIENT_ID are required");
        }
        String jwks = jwtProperties.jwksUri();
        if (jwks == null || jwks.isBlank()) {
            jwks = jwtProperties.issuer().replaceAll("/+$", "") + "/protocol/openid-connect/certs";
        }
        this.provider = new JwkProviderBuilder(URI.create(jwks).toURL()).build();
    }

    public Claims extractAllClaims(String token) {
        if (provider == null) throw new JwtException("SSO authentication is not configured");
        var parsed = Jwts.parser()
                .keyLocator(header -> {
                    try { return (Key) provider.get((String) header.get("kid")).getPublicKey(); }
                    catch (Exception e) { throw new JwtSigningKeyException("Failed to resolve signing key", e); }
                })
                .requireIssuer(jwtProperties.issuer())
                .require("azp", jwtProperties.clientId())
                .require("typ", "Bearer")
                .build().parseSignedClaims(token);
        Claims claims = parsed.getPayload();
        String idp = claims.get("identity_provider", String.class);
        if (!"RS256".equals(parsed.getHeader().getAlgorithm()) || claims.getExpiration() == null
                || !(STAFF_PROVIDERS.contains(idp == null ? "" : idp) || "bceidbusiness".equals(idp))
                || auditUsername(claims).isBlank()) {
            throw new JwtException("A CSP user access token with an audit identity is required");
        }
        return claims;
    }

    public String extractUsername(String token) { return auditUsername(extractAllClaims(token)); }

    private String auditUsername(Claims claims) {
        String key = "bceidbusiness".equals(claims.get("identity_provider")) ? "bceid_username" : "idir_username";
        Object value = claims.get(key);
        return value instanceof String username ? username.trim() : "";
    }

    public List<GrantedAuthority> extractAuthorities(String token) {
        Claims claims = extractAllClaims(token);
        // Business BCeID cannot inherit CSP staff capabilities. Industry client scope
        // requires its own agreed role/capability contract before granting app access.
        if (!STAFF_PROVIDERS.contains(claims.get("identity_provider", String.class))) return List.of();
        List<String> roles = stringRoles(claims.get("client_roles"));
        if (roles.isEmpty() && claims.get("resource_access") instanceof Map<?, ?> byClient
                && byClient.get(jwtProperties.clientId()) instanceof Map<?, ?> client) {
            roles = stringRoles(client.get("roles"));
        }
        List<String> clientRoles = roles;
        return List.of(Roles.ADMIN, Roles.APPROVE, Roles.VIEW).stream()
                .filter(role -> clientRoles.contains("CSP_" + role))
                .map(role -> (GrantedAuthority) new SimpleGrantedAuthority(role)).toList();
    }

    private static List<String> stringRoles(Object claim) {
        return claim instanceof List<?> values ? values.stream().filter(String.class::isInstance)
                .map(value -> ((String) value).trim().toUpperCase(Locale.ROOT))
                .filter(role -> !role.isBlank()).toList() : List.of();
    }
}
