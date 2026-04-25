package com.whitenights.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitenights.auth.api.dto.LoginRequest;
import com.whitenights.auth.api.dto.RegisterRequest;
import com.whitenights.auth.domain.VerificationToken;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.auth.repository.VerificationTokenRepository;
import com.whitenights.user.api.dto.UpdateProfileRequest;
import com.whitenights.user.repository.FollowRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class FollowIT {

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
    private com.whitenights.common.ratelimit.RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService.clearBuckets();
        followRepository.deleteAll();
        refreshTokenRepository.deleteAll();
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String getAccessToken(String email, String password, String nickname) throws Exception {
        RegisterRequest registerRequest = new RegisterRequest(nickname, email, password);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        VerificationToken token = tokenRepository.findAll().get(0);
        mockMvc.perform(post("/api/auth/verify")
                .param("token", token.getToken()))
                .andExpect(status().isOk());

        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    @Test
    void shouldFollowPublicProfile() throws Exception {
        String token1 = getAccessToken("user1@example.com", "password123", "user1");
        String token2 = getAccessToken("user2@example.com", "password123", "user2");
        Long user2Id = userRepository.findByNickname("user2").get().getUserId();

        // Follow user2
        mockMvc.perform(post("/api/users/" + user2Id + "/follow")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk());

        // Check status on profile
        mockMvc.perform(get("/api/users/user2")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followStatus").value("accepted"))
                .andExpect(jsonPath("$.followerCount").value(1));
    }

    @Test
    void shouldFollowPrivateProfileAndAccept() throws Exception {
        String token1 = getAccessToken("user1@example.com", "password123", "user1");
        String token2 = getAccessToken("user2@example.com", "password123", "user2");
        
        // Make user2 private
        mockMvc.perform(patch("/api/users/me")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new UpdateProfileRequest(null, null, true))))
                .andExpect(status().isOk());

        Long user1Id = userRepository.findByNickname("user1").get().getUserId();
        Long user2Id = userRepository.findByNickname("user2").get().getUserId();

        // user1 follows user2
        mockMvc.perform(post("/api/users/" + user2Id + "/follow")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk());

        // Status should be pending
        mockMvc.perform(get("/api/users/user2")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followStatus").value("pending"))
                .andExpect(jsonPath("$.followerCount").value(0))
                .andExpect(jsonPath("$.isPrivate").value(true))
                .andExpect(jsonPath("$.email").isEmpty()); // Hidden because not followed

        // user2 sees request
        mockMvc.perform(get("/api/users/me/follow-requests")
                .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].nickname").value("user1"));

        // user2 accepts
        mockMvc.perform(post("/api/users/me/follow-requests/" + user1Id + "/accept")
                .header("Authorization", "Bearer " + token2))
                .andExpect(status().isOk());

        // user1 now follows user2
        mockMvc.perform(get("/api/users/user2")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followStatus").value("accepted"))
                .andExpect(jsonPath("$.followerCount").value(1));
    }

    @Test
    void shouldNotFollowSelf() throws Exception {
        String token1 = getAccessToken("user1@example.com", "password123", "user1");
        Long user1Id = userRepository.findByNickname("user1").get().getUserId();

        mockMvc.perform(post("/api/users/" + user1Id + "/follow")
                .header("Authorization", "Bearer " + token1))
                .andExpect(status().isBadRequest());
    }
}
