package com.whitenights.tracker.repository;

import com.whitenights.tracker.domain.TrackerEntry;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TrackerRepository extends JpaRepository<TrackerEntry, TrackerEntry.TrackerEntryId> {

    @Query("""
            SELECT t FROM TrackerEntry t
            WHERE t.id.userId = :userId
              AND YEAR(t.id.date) = :year
              AND MONTH(t.id.date) = :month
            ORDER BY t.id.date ASC
            """)
    List<TrackerEntry> findByUserIdAndYearMonth(
            @Param("userId") Long userId,
            @Param("year") int year,
            @Param("month") int month);

  @Query("""
      SELECT COALESCE(SUM(t.pagesRead), 0) FROM TrackerEntry t
      WHERE t.id.userId = :userId
        AND YEAR(t.id.date) = :year
        AND MONTH(t.id.date) = :month
      """)
  long sumPagesByUserIdAndYearMonth(
      @Param("userId") Long userId,
      @Param("year") int year,
      @Param("month") int month);
}
