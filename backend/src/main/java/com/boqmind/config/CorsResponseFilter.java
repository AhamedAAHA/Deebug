package com.boqmind.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * Ensures CORS headers are set on every /api response (including errors and OPTIONS),
 * so Cloudflare Pages previews can call Render even when origin pattern config is wrong.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class CorsResponseFilter extends OncePerRequestFilter {

    private static final Pattern PAGES_PREVIEW = Pattern.compile(
            "https://[a-zA-Z0-9-]+\\.deebug\\.pages\\.dev");
    private static final Pattern PAGES_ROOT = Pattern.compile("https://deebug\\.pages\\.dev");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String origin = request.getHeader("Origin");

        if (origin != null && isAllowedOrigin(origin)) {
            response.setHeader("Access-Control-Allow-Origin", origin);
            response.setHeader("Access-Control-Allow-Credentials", "true");
            response.setHeader("Vary", "Origin");
            String requestHeaders = request.getHeader("Access-Control-Request-Headers");
            if (requestHeaders != null && !requestHeaders.isBlank()) {
                response.setHeader("Access-Control-Allow-Headers", requestHeaders);
            } else {
                response.setHeader("Access-Control-Allow-Headers", "*");
            }
            response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
            response.setHeader("Access-Control-Max-Age", "3600");
        }

        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            response.setStatus(HttpServletResponse.SC_OK);
            return;
        }

        filterChain.doFilter(request, response);
    }

    static boolean isAllowedOrigin(String origin) {
        if (origin == null || origin.isBlank()) {
            return false;
        }
        if (PAGES_PREVIEW.matcher(origin).matches() || PAGES_ROOT.matcher(origin).matches()) {
            return true;
        }
        return origin.startsWith("http://localhost:")
                || origin.startsWith("http://127.0.0.1:")
                || origin.equals("http://localhost:5173")
                || origin.equals("http://127.0.0.1:5173");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api");
    }
}
