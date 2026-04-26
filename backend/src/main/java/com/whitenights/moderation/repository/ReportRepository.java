package com.whitenights.moderation.repository;

import com.whitenights.moderation.domain.Report;
import com.whitenights.moderation.domain.ReportStatus;
import com.whitenights.moderation.domain.ReportTargetType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    boolean existsByReporter_UserIdAndTargetTypeAndTargetIdAndStatus(
            Long reporterId, ReportTargetType targetType, Long targetId, ReportStatus status);

    List<Report> findByReporter_UserIdOrderByCreatedAtDesc(Long reporterId);

    @Query("""
            SELECT r FROM Report r
            WHERE r.status IN :statuses
              AND (:cursor IS NULL OR r.reportId > :cursor)
            ORDER BY r.reportId ASC
            """)
    List<Report> findQueueWithCursor(
            @Param("statuses") List<ReportStatus> statuses,
            @Param("cursor") Long cursor,
            Pageable pageable);

    long countByStatus(ReportStatus status);
}
