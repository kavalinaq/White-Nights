package com.whitenights.support.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SupportReplyRequest(
    @NotBlank @Size(max = 5000) String response
) {

}
