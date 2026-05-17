package com.whitenights.tracker.api;

import com.whitenights.auth.domain.User;
import com.whitenights.auth.repository.UserRepository;
import com.whitenights.common.exception.types.NotFoundException;
import com.whitenights.common.security.CurrentUserResolver;
import com.whitenights.tracker.api.dto.MonthlyPagesResponse;
import com.whitenights.tracker.api.dto.TrackerEntryResponse;
import com.whitenights.tracker.api.dto.UpsertTrackerEntryRequest;
import com.whitenights.tracker.service.TrackerService;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class TrackerController {

    private final TrackerService trackerService;
    private final UserRepository userRepository;
  private final CurrentUserResolver currentUserResolver;

    @GetMapping("/api/tracker")
    public List<TrackerEntryResponse> getMonth(
            @RequestParam String month,
            @AuthenticationPrincipal String email) {
        YearMonth yearMonth = YearMonth.parse(month);
      return trackerService.getMonth(currentUserResolver.resolve(email), yearMonth);
    }

    @PutMapping("/api/tracker/{date}")
    @ResponseStatus(HttpStatus.OK)
    public TrackerEntryResponse upsert(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @RequestBody UpsertTrackerEntryRequest request,
            @AuthenticationPrincipal String email) {
      return trackerService.upsert(currentUserResolver.resolve(email), date, request.pagesRead());
    }

  @GetMapping("/api/users/{nickname}/tracker/monthly-summary")
  public MonthlyPagesResponse getMonthlyTotal(
      @PathVariable String nickname,
      @RequestParam(required = false) String month) {
    YearMonth yearMonth = month != null ? YearMonth.parse(month) : YearMonth.now();
    User target = userRepository.findByNickname(nickname)
        .orElseThrow(() -> new NotFoundException("User not found"));
    long pages = trackerService.getMonthlyTotal(target, yearMonth);
    return new MonthlyPagesResponse(yearMonth.toString(), pages);
    }

    @DeleteMapping("/api/tracker/{date}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal String email) {
      trackerService.delete(currentUserResolver.resolve(email), date);
    }

}
