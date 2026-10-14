package ca.bc.gov.nrs.csp.backend.config;

import ca.bc.gov.nrs.csp.backend.filter.JwtRequestFilter;
import ca.bc.gov.nrs.csp.backend.filter.MockRequestFilter;
import ca.bc.gov.nrs.csp.backend.service.JwtService;
import ca.bc.gov.nrs.csp.backend.util.constants.Roles;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.web.configurers.HeadersConfigurer;
import jakarta.servlet.http.HttpServletResponse;

import java.util.Optional;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(JwtProperties.class)
public class SecurityConfig {

    private static final String API_PATH = "/api/**";

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            JwtService jwtService,
            Optional<MockRequestFilter> mockRequestFilter) throws Exception {

        // Not a @Bean — keeps it out of the servlet container's filter registry so it
        // only runs inside the Spring Security filter chain (where SecurityContextHolder
        // is properly managed for stateless sessions).
        JwtRequestFilter jwtRequestFilter = new JwtRequestFilter(jwtService);

        mockRequestFilter.ifPresent(f ->
                http.addFilterBefore(f, UsernamePasswordAuthenticationFilter.class));
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);

        http
                // Safe to disable: stateless sessions (no session cookie) + JWT via Authorization
                // header means there is no browser-automatable credential for CSRF to exploit.
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) ->
                                res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(
                                "/api/health",
                                "/api/swagger-ui/**", "/api/swagger-ui.html",
                                "/api/v3/api-docs/**"
                        ).permitAll()
                        .requestMatchers(API_PATH).hasAnyAuthority(Roles.ADMIN, Roles.APPROVE, Roles.VIEW)
                        .anyRequest().authenticated()
                );

        http.headers(headers -> headers
                .contentSecurityPolicy(csp -> csp.policyDirectives(
                        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:"))
                .frameOptions(frame -> frame.deny())
                // HSTS is deliberately NOT set here, and this service must not start setting it.
                //
                // It is a TRANSPORT policy — an assertion about the origin's own TLS — so it belongs
                // to the layer the browser speaks TLS to. That is the OpenShift edge router, and the
                // header is emitted by the layer in front of it (frontend/Caddyfile). This service
                // terminates no TLS, has no Route (backend/openshift.deploy.yml declares only a
                // ClusterIP Service on 8080), and is therefore never browser-reachable: the browser
                // would never see a header this service set except via the proxy, which sets its own.
                //
                // Spring emitted one anyway because `forward-headers-strategy: framework` makes it
                // treat a request carrying X-Forwarded-Proto: https as secure, which is wanted for
                // correct absolute URLs but also switched HSTS on. Two layers emitting it is what a
                // ZAP scan reported as a duplicate Strict-Transport-Security header.
                //
                // The proxy cannot fix this by stripping: a `header_down -Strict-Transport-Security`
                // in Caddy removes Caddy's own value too and leaves /api/* with no security headers
                // at all (measured — see the note in frontend/Caddyfile). Fixing it at the source is
                // what keeps exactly one owner.
                //
                // The content policies above stay: unlike HSTS they are per-response protections
                // that make sense from whoever produced the body, including the backend-served
                // Swagger UI, and they cost nothing behind the proxy.
                .httpStrictTransportSecurity(HeadersConfigurer.HstsConfig::disable)
        );

        return http.build();
    }
}
