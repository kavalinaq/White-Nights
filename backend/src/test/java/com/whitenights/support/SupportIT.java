package com.whitenights.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.whitenights.AbstractIT;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.support.api.dto.SubmitSupportRequest;
import com.whitenights.support.api.dto.SupportReplyRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

class SupportIT extends AbstractIT {

  @Test
  void userSubmitsTicketAndAdminCanReply() throws Exception {
    String userToken = registerAndLogin("user@example.com", "password123", "user");
    String adminToken = registerAndLogin("admin@example.com", "password123", "admin", UserRole.admin);

    MvcResult submit = mockMvc.perform(post("/api/support/messages")
            .header("Authorization", "Bearer " + userToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new SubmitSupportRequest("Login broken", "I can't log in."))))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.status").value("open"))
        .andExpect(jsonPath("$.subject").value("Login broken"))
        .andExpect(jsonPath("$.userNickname").value("user"))
        .andReturn();
    long ticketId = objectMapper.readTree(submit.getResponse().getContentAsString())
        .get("supportMessageId").asLong();

    // Admin sees the ticket
    mockMvc.perform(get("/api/admin/support/messages")
            .header("Authorization", "Bearer " + adminToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(1))
        .andExpect(jsonPath("$[0].subject").value("Login broken"));

    // Admin replies
    mockMvc.perform(post("/api/admin/support/messages/" + ticketId + "/reply")
            .header("Authorization", "Bearer " + adminToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new SupportReplyRequest("Try resetting your password."))))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.status").value("resolved"))
        .andExpect(jsonPath("$.response").value("Try resetting your password."))
        .andExpect(jsonPath("$.respondedByNickname").value("admin"));

    // User sees the reply in their history
    mockMvc.perform(get("/api/support/messages/me")
            .header("Authorization", "Bearer " + userToken))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[0].status").value("resolved"))
        .andExpect(jsonPath("$[0].response").value("Try resetting your password."));
  }

  @Test
  void nonAdminCannotListOrReply() throws Exception {
    String userToken = registerAndLogin("user@example.com", "password123", "user");
    String modToken = registerAndLogin("mod@example.com", "password123", "mod", UserRole.moderator);

    mockMvc.perform(get("/api/admin/support/messages")
            .header("Authorization", "Bearer " + userToken))
        .andExpect(status().isForbidden());

    mockMvc.perform(get("/api/admin/support/messages")
            .header("Authorization", "Bearer " + modToken))
        .andExpect(status().isForbidden());

    // Submit a ticket as user so reply target exists
    MvcResult submit = mockMvc.perform(post("/api/support/messages")
            .header("Authorization", "Bearer " + userToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(
                new SubmitSupportRequest("Hi", "Hello support."))))
        .andExpect(status().isCreated())
        .andReturn();
    long ticketId = objectMapper.readTree(submit.getResponse().getContentAsString())
        .get("supportMessageId").asLong();

    mockMvc.perform(post("/api/admin/support/messages/" + ticketId + "/reply")
            .header("Authorization", "Bearer " + modToken)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new SupportReplyRequest("nope"))))
        .andExpect(status().isForbidden());
  }
}
