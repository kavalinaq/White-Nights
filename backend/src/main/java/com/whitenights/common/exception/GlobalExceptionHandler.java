package com.whitenights.common.exception;

import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(com.whitenights.common.exception.types.ConflictException.class)
    public ResponseEntity<Map<String, String>> handleConflictException(com.whitenights.common.exception.types.ConflictException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.CONFLICT).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(com.whitenights.common.exception.types.UnauthorizedException.class)
    public ResponseEntity<Map<String, String>> handleUnauthorizedException(com.whitenights.common.exception.types.UnauthorizedException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(com.whitenights.common.exception.types.TooManyRequestsException.class)
    public ResponseEntity<Map<String, String>> handleTooManyRequestsException(com.whitenights.common.exception.types.TooManyRequestsException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(com.whitenights.common.exception.types.ForbiddenException.class)
    public ResponseEntity<Map<String, String>> handleForbiddenException(com.whitenights.common.exception.types.ForbiddenException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(com.whitenights.common.exception.types.NotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFoundException(com.whitenights.common.exception.types.NotFoundException e) {
        return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("message", e.getMessage()));
    }

  @ExceptionHandler(com.whitenights.common.exception.types.BadRequestException.class)
  public ResponseEntity<Map<String, String>> handleBadRequestException(com.whitenights.common.exception.types.BadRequestException e) {
    return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
  }

  @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
  public ResponseEntity<Map<String, String>> handleAccessDeniedException(org.springframework.security.access.AccessDeniedException e) {
    return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).body(Map.of("message", "Access denied"));
  }

  @ExceptionHandler(com.whitenights.common.exception.types.StorageException.class)
  public ResponseEntity<Map<String, String>> handleStorageException(com.whitenights.common.exception.types.StorageException e) {
    return ResponseEntity.status(org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("message", e.getMessage()));
  }

  @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
