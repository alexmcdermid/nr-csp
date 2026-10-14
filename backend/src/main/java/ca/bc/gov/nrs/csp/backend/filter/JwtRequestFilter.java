package ca.bc.gov.nrs.csp.backend.filter;

import ca.bc.gov.nrs.csp.backend.exception.JwtSigningKeyException;
import ca.bc.gov.nrs.csp.backend.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.apache.logging.log4j.CloseableThreadContext;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collection;

public class JwtRequestFilter extends OncePerRequestFilter {

    private static final Logger log = LogManager.getLogger(JwtRequestFilter.class);

    private final JwtService jwtUtil;

    public JwtRequestFilter(JwtService jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            chain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        String username;

        try {
            username = jwtUtil.extractUsername(jwt);

            if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                Collection<? extends GrantedAuthority> authorities = jwtUtil.extractAuthorities(jwt);
                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(username, null, authorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        } catch (JwtSigningKeyException e) {
            log.error("JWT signing key resolution failed.", e);
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token signature.");
            return;
        } catch (ExpiredJwtException e) {
            log.warn("JWT expired.");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Token has expired.");
            return;
        } catch (JwtException e) {
            log.warn("JWT invalid.");
            response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid token.");
            return;
        }

        // Expose the authenticated user (IDIR) to every log line emitted while handling this
        // request via the Log4j2 ThreadContext (MDC). Auto-removed when the request completes.
        try (CloseableThreadContext.Instance ignored =
                     CloseableThreadContext.put("user", username != null ? username : "anonymous")) {
            chain.doFilter(request, response);
        }
    }
}
