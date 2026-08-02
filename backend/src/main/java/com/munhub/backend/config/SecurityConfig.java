package com.munhub.backend.config;

import com.munhub.backend.security.BearerTokenAuthFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, BearerTokenAuthFilter bearerTokenAuthFilter)
      throws Exception {
    http.csrf(csrf -> csrf.disable())
        .cors(Customizer.withDefaults())
        .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(
            auth ->
                auth.requestMatchers("/api/auth/register", "/api/auth/login")
                    .permitAll()
                    // WS auth happens at the STOMP CONNECT frame (see WebSocketAuthChannelInterceptor),
                    // not at the HTTP upgrade request, since browsers can't set custom headers on it.
                    .requestMatchers("/ws/**")
                    .permitAll()
                    .requestMatchers("/h2-console/**")
                    .permitAll()
                    .anyRequest()
                    .authenticated())
        .headers(headers -> headers.frameOptions(frame -> frame.sameOrigin()))
        .exceptionHandling(
            ex ->
                ex.authenticationEntryPoint(
                    (request, response, authException) -> {
                      response.setStatus(401);
                      response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                      response.getWriter().write("{\"status\":401,\"message\":\"Authentication required.\"}");
                    }))
        .addFilterBefore(bearerTokenAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }
}
