package com.whitenights;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitenights.auth.api.dto.LoginRequest;
import com.whitenights.auth.api.dto.RegisterRequest;
import com.whitenights.auth.domain.User;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.ratelimit.RateLimitingService;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

/**
 * Base class for integration tests. Truncates users + clears rate-limiting buckets before each test, and provides a helper to register-verify-login a user and return a bearer token (optionally
 * elevating to moderator/admin).
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIT {

  @Autowired
  protected MockMvc mockMvc;
  @Autowired
  protected ObjectMapper objectMapper;
  @Autowired
  protected UserRepository userRepository;
  @Autowired
  protected RateLimitingService rateLimitingService;
  @Autowired
  protected JdbcTemplate jdbcTemplate;

  @BeforeEach
  void resetState() {
    rateLimitingService.clearBuckets();
    jdbcTemplate.execute("TRUNCATE \"users\" CASCADE");
  }

  protected String registerAndLogin(String email, String password, String nickname) throws Exception {
    return registerAndLogin(email, password, nickname, UserRole.user);
  }

  protected String registerAndLogin(String email, String password, String nickname, UserRole role) throws Exception {
    RegisterRequest registerRequest = new RegisterRequest(nickname, email, password);
    mockMvc.perform(post("/api/auth/register")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(registerRequest)))
        .andExpect(status().isCreated());

    String verificationToken = jdbcTemplate.queryForObject(
        "SELECT vt.token FROM verification_tokens vt " +
            "JOIN users u ON u.user_id = vt.user_id " +
            "WHERE u.email = ?",
        String.class, email);
    mockMvc.perform(post("/api/auth/verify").param("token", verificationToken))
        .andExpect(status().isOk());

    if (role != UserRole.user) {
      User user = userRepository.findByEmail(email).orElseThrow();
      user.setRole(role);
      userRepository.save(user);
    }

    LoginRequest loginRequest = new LoginRequest(email, password);
    MvcResult result = mockMvc.perform(post("/api/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(loginRequest)))
        .andExpect(status().isOk())
        .andReturn();

    return objectMapper.readTree(result.getResponse().getContentAsString())
        .get("accessToken").asText();
  }

  protected Long userId(String nickname) {
    return userRepository.findByNickname(nickname).orElseThrow().getUserId();
  }
}
