package com.whitenights.auth;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitenights.AbstractIT;
import com.whitenights.auth.api.dto.RegisterRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class ExpiredTokenIT extends AbstractIT {

  @Autowired
  private ObjectMapper mapper;

  @Test
  void verifyWithExpiredTokenReturns401() throws Exception {
    // Register a user — this creates a verification token
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(mapper.writeValueAsString(
                new RegisterRequest("expirednick", "expired@example.com", "password123"))))
        .andExpect(status().isCreated());

    // Look up the freshly-issued token and force-expire it directly in the DB
    String token = jdbcTemplate.queryForObject(
        "SELECT vt.token FROM verification_tokens vt " +
            "JOIN users u ON u.user_id = vt.user_id " +
            "WHERE u.email = ?",
        String.class, "expired@example.com");
    jdbcTemplate.update("UPDATE verification_tokens SET expires_at = NOW() - INTERVAL '1 day' WHERE token = ?", token);

    // Should now return 401, not 500
    mockMvc.perform(post("/api/auth/verify").param("token", token))
        .andExpect(status().isUnauthorized());
  }
}
