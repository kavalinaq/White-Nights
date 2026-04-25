package com.whitenights.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitenights.auth.api.dto.LoginRequest;
import com.whitenights.auth.api.dto.RegisterRequest;
import com.whitenights.auth.domain.VerificationToken;
import com.whitenights.auth.repository.PasswordResetTokenRepository;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.auth.repository.VerificationTokenRepository;
import com.whitenights.user.repository.FollowRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AuthIT {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VerificationTokenRepository tokenRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private FollowRepository followRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private com.whitenights.common.ratelimit.RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService.clearBuckets();
        followRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        passwordResetTokenRepository.deleteAll();
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void shouldRegisterVerifyAndLogin() throws Exception {
        // 1. Register
        RegisterRequest registerRequest = new RegisterRequest("testuser", "test@example.com", "password123");
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        assertThat(userRepository.findByEmail("test@example.com")).isPresent();
        assertThat(userRepository.findByEmail("test@example.com").get().isVerified()).isFalse();

        // 2. Login fails (unverified)
        LoginRequest loginRequest = new LoginRequest("test@example.com", "password123");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isUnauthorized());

        // 3. Duplicate register fails
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isConflict());

        // 4. Verify
        VerificationToken token = tokenRepository.findAll().get(0);
        mockMvc.perform(post("/api/auth/verify")
                .param("token", token.getToken()))
                .andExpect(status().isOk());

        assertThat(userRepository.findByEmail("test@example.com").get().isVerified()).isTrue();

        // 4. Login succeeds
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"))
                .andExpect(cookie().httpOnly("refresh_token", true));

        // 5. Refresh succeeds
        Cookie refreshTokenCookie = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andReturn().getResponse().getCookie("refresh_token");

        mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshTokenCookie))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("refresh_token"));

        // 6. Logout succeeds
        mockMvc.perform(post("/api/auth/logout")
                .cookie(refreshTokenCookie))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge("refresh_token", 0));
    }
}
