package com.whitenights.tracker;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.whitenights.AbstractIT;
import com.whitenights.tracker.api.dto.UpsertTrackerEntryRequest;
import java.time.LocalDate;
import java.time.YearMonth;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

class TrackerMonthlyIT extends AbstractIT {

  @Test
  void shouldReturnZeroForUserWithoutEntries() throws Exception {
    registerAndLogin("reader@example.com", "password123", "reader");

    mockMvc.perform(get("/api/users/reader/tracker/monthly-summary")
            .param("month", "2026-05"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.month").value("2026-05"))
        .andExpect(jsonPath("$.pagesRead").value(0));
  }

  @Test
  void shouldSumOnlyEntriesInRequestedMonth() throws Exception {
    String token = registerAndLogin("reader@example.com", "password123", "reader");

    upsert(token, LocalDate.of(2026, 5, 1), 30);
    upsert(token, LocalDate.of(2026, 5, 15), 70);
    upsert(token, LocalDate.of(2026, 4, 30), 999); // different month, must not count

    mockMvc.perform(get("/api/users/reader/tracker/monthly-summary")
            .param("month", "2026-05"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.pagesRead").value(100));
  }

  @Test
  void shouldDefaultToCurrentMonthWhenMonthOmitted() throws Exception {
    String token = registerAndLogin("reader@example.com", "password123", "reader");
    YearMonth current = YearMonth.now();
    upsert(token, current.atDay(1), 42);

    mockMvc.perform(get("/api/users/reader/tracker/monthly-summary"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.month").value(current.toString()))
        .andExpect(jsonPath("$.pagesRead").value(42));
  }

  @Test
  void shouldReturnNotFoundForUnknownNickname() throws Exception {
    mockMvc.perform(get("/api/users/ghost/tracker/monthly-summary"))
        .andExpect(status().isNotFound());
  }

  private void upsert(String token, LocalDate date, int pages) throws Exception {
    mockMvc.perform(put("/api/tracker/" + date)
            .header("Authorization", "Bearer " + token)
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(new UpsertTrackerEntryRequest(pages))))
        .andExpect(status().isOk());
  }
}
