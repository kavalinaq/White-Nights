package com.whitenights.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.whitenights.auth.api.dto.LoginRequest;
import com.whitenights.auth.api.dto.RegisterRequest;
import com.whitenights.auth.domain.VerificationToken;
import com.whitenights.auth.repository.RefreshTokenRepository;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.auth.repository.VerificationTokenRepository;
import com.whitenights.user.api.dto.UpdateProfileRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ProfileIT {

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
    private com.whitenights.common.ratelimit.RateLimitingService rateLimitingService;

    @BeforeEach
    void setUp() {
        rateLimitingService.clearBuckets();
        refreshTokenRepository.deleteAll();
        tokenRepository.deleteAll();
        userRepository.deleteAll();
    }

    private String getAccessToken(String email, String password, String nickname) throws Exception {
        // Register
        RegisterRequest registerRequest = new RegisterRequest(nickname, email, password);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerRequest)))
                .andExpect(status().isCreated());

        // Verify
        VerificationToken token = tokenRepository.findAll().get(0);
        mockMvc.perform(post("/api/auth/verify")
                .param("token", token.getToken()))
                .andExpect(status().isOk());

        // Login
        LoginRequest loginRequest = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
                .andExpect(status().isOk())
                .andReturn();

        String response = result.getResponse().getContentAsString();
        return objectMapper.readTree(response).get("accessToken").asText();
    }

    @Test
    void shouldManageProfile() throws Exception {
        String token = getAccessToken("user@example.com", "password123", "myuser");

        // Get me
        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("myuser"))
                .andExpect(jsonPath("$.email").value("user@example.com"));

        // Update profile
        UpdateProfileRequest updateRequest = new UpdateProfileRequest("newnick", "My bio", true);
        mockMvc.perform(patch("/api/users/me")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nickname").value("newnick"))
                .andExpect(jsonPath("$.bio").value("My bio"))
                .andExpect(jsonPath("$.isPrivate").value(true));

        // Get by nickname (public view, but it's me)
        mockMvc.perform(get("/api/users/newnick")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("user@example.com"));

        // Another user views private profile
        String otherToken = getAccessToken("other@example.com", "password123", "otheruser");
        mockMvc.perform(get("/api/users/newnick")
                .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").isEmpty())
                .andExpect(jsonPath("$.bio").value("My bio"))
                .andExpect(jsonPath("$.isPrivate").value(true));
    }

    @Test
    void shouldUploadAvatar() throws Exception {
        String token = getAccessToken("avatar@example.com", "password123", "avataruser");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.png",
                MediaType.IMAGE_PNG_VALUE,
                "test image content".getBytes()
        );

        mockMvc.perform(multipart("/api/users/me/avatar")
                .file(file)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").isNotEmpty());

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").isNotEmpty());

        // Delete avatar
        mockMvc.perform(delete("/api/users/me/avatar")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/me")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl").isEmpty());
    }

    @Test
    void shouldRejectNonImageAvatar() throws Exception {
        String token = getAccessToken("badfile@example.com", "password123", "baduser");

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "test.txt",
                MediaType.TEXT_PLAIN_VALUE,
                "not an image".getBytes()
        );

        mockMvc.perform(multipart("/api/users/me/avatar")
                .file(file)
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectDuplicateNickname() throws Exception {
        getAccessToken("user1@example.com", "password123", "nick1");
        String token2 = getAccessToken("user2@example.com", "password123", "nick2");

        UpdateProfileRequest updateRequest = new UpdateProfileRequest("nick1", null, null);
        mockMvc.perform(patch("/api/users/me")
                .header("Authorization", "Bearer " + token2)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateRequest)))
                .andExpect(status().isConflict());
    }
}
