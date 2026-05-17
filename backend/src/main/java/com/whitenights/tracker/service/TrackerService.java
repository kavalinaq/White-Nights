package com.whitenights.tracker.service;

import com.whitenights.auth.domain.User;
import com.whitenights.tracker.api.dto.TrackerEntryResponse;
import com.whitenights.tracker.domain.TrackerEntry;
import com.whitenights.tracker.repository.TrackerRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class TrackerService {

    private final TrackerRepository trackerRepository;

    public List<TrackerEntryResponse> getMonth(User user, YearMonth month) {
        return trackerRepository
                .findByUserIdAndYearMonth(user.getUserId(), month.getYear(), month.getMonthValue())
                .stream()
                .map(e -> new TrackerEntryResponse(e.getId().getDate(), e.getPagesRead()))
                .toList();
    }

  public long getMonthlyTotal(User user, YearMonth month) {
    return trackerRepository.sumPagesByUserIdAndYearMonth(
        user.getUserId(), month.getYear(), month.getMonthValue());
  }

  @Transactional
    public TrackerEntryResponse upsert(User user, LocalDate date, Integer pagesRead) {
        TrackerEntry.TrackerEntryId id = new TrackerEntry.TrackerEntryId(user.getUserId(), date);
        TrackerEntry entry = trackerRepository.findById(id)
                .orElseGet(() -> TrackerEntry.builder().id(id).user(user).build());
        entry.setPagesRead(pagesRead);
        trackerRepository.save(entry);
        return new TrackerEntryResponse(date, pagesRead);
    }

    @Transactional
    public void delete(User user, LocalDate date) {
        trackerRepository.deleteById(new TrackerEntry.TrackerEntryId(user.getUserId(), date));
    }
}
