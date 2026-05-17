package com.whitenights.admin;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.whitenights.AbstractIT;
import com.whitenights.auth.domain.UserRole;
import com.whitenights.chat.service.PresenceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class AdminStatsIT extends AbstractIT {

  @Autowired
  private PresenceService presenceService;

  @Test
  void shouldRejectNonAdminFromStats() throws Exception {
    String token = registerAndLogin("regular@example.com", "password123", "regular");

    mockMvc.perform(get("/api/admin/stats")
            .header("Authorization", "Bearer " + token))
        .andExpect(status().isForbidden());
  }

  @Test
  void shouldReturnCountsIncludingModeratorsAndOnlineUsers() throws Exception {
    String adminToken = registerAndLogin("admin@example.com", "password123", "admin", UserRole.admin);
    registerAndLogin("mod1@example.com", "password123", "mod1", UserRole.moderator);
    registerAndLogin("mod2@example.com", "password123", "mod2", UserRole.moderator);
    registerAndLogin("user1@example.com", "password123", "user1");

    Long mod1Id = userId("mod1");
    Long user1Id = userId("user1");
    presenceService.userConnected(mod1Id);
    presenceService.userConnected(user1Id);

    try {
      mockMvc.perform(get("/api/admin/stats")
              .header("Authorization", "Bearer " + adminToken))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.users").value(4))
          .andExpect(jsonPath("$.moderators").value(2))
          .andExpect(jsonPath("$.onlineUsers").value(2))
          .andExpect(jsonPath("$.posts").value(0))
          .andExpect(jsonPath("$.pendingReports").value(0));
    } finally {
      presenceService.userDisconnected(mod1Id);
      presenceService.userDisconnected(user1Id);
    }
  }
}
