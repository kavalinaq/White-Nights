package com.whitenights.common.exception;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.util.Map;

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

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
}
