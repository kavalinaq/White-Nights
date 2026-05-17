package com.whitenights.chat;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.whitenights.AbstractIT;
import com.whitenights.chat.api.dto.CreateChatRequest;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MvcResult;

class ChatAvatarIT extends AbstractIT {

  @Test
  void onlyOwnerCanSetGroupAvatar() throws Exception {
    String ownerToken = registerAndLogin("owner@example.com", "password123", "owner");
    String memberToken = registerAndLogin("member@example.com", "password123", "member");
    Long memberId = userId("member");

    Long chatId = createGroup(ownerToken, "Book club", List.of(memberId));

    MockMultipartFile file = pngFile();

    // member is forbidden
    mockMvc.perform(multipart("/api/chats/" + chatId + "/avatar")
            .file(file)
            .header("Authorization", "Bearer " + memberToken))
        .andExpect(status().isForbidden());

    // owner succeeds
    mockMvc.perform(multipart("/api/chats/" + chatId + "/avatar")
            .file(file)
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.avatarUrl").isNotEmpty());
  }

  @Test
  void rejectsAvatarOnDirectChat() throws Exception {
    String aliceToken = registerAndLogin("alice@example.com", "password123", "alice");
    String bobToken = registerAndLogin("bob@example.com", "password123", "bob");
    Long bobId = userId("bob");

    MvcResult result = mockMvc.perform(post("/api/chats")
            .header("Authorization", "Bearer " + aliceToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new CreateChatRequest(bobId, null, null))))
        .andExpect(status().isCreated())
        .andReturn();
    Long chatId = objectMapper.readTree(result.getResponse().getContentAsString())
        .get("chatId").asLong();

    // both participants are members, neither is owner — both should hit isGroup guard
    mockMvc.perform(multipart("/api/chats/" + chatId + "/avatar")
            .file(pngFile())
            .header("Authorization", "Bearer " + aliceToken))
        .andExpect(status().isForbidden());

    mockMvc.perform(multipart("/api/chats/" + chatId + "/avatar")
            .file(pngFile())
            .header("Authorization", "Bearer " + bobToken))
        .andExpect(status().isForbidden());
  }

  @Test
  void membersEndpointReturnsAllMembersWithRoles() throws Exception {
    String ownerToken = registerAndLogin("owner@example.com", "password123", "owner");
    registerAndLogin("member@example.com", "password123", "member");
    Long memberId = userId("member");

    Long chatId = createGroup(ownerToken, "Book club", List.of(memberId));

    mockMvc.perform(get("/api/chats/" + chatId + "/members")
            .header("Authorization", "Bearer " + ownerToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[?(@.nickname=='owner')].role").value("owner"))
        .andExpect(jsonPath("$[?(@.nickname=='member')].role").value("member"));
  }

  private Long createGroup(String token, String name, List<Long> memberIds) throws Exception {
    MvcResult result = mockMvc.perform(post("/api/chats")
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new CreateChatRequest(null, name, memberIds))))
        .andExpect(status().isCreated())
        .andReturn();
    return objectMapper.readTree(result.getResponse().getContentAsString())
        .get("chatId").asLong();
  }

  private MockMultipartFile pngFile() {
    return new MockMultipartFile(
        "file",
        "avatar.png",
        MediaType.IMAGE_PNG_VALUE,
        "fake-png-bytes".getBytes()
    );
  }
}
