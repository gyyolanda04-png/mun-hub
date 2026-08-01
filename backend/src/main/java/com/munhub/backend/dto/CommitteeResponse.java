package com.munhub.backend.dto;

import com.munhub.backend.model.Committee;
import java.util.List;

public record CommitteeResponse(
    String id,
    String name,
    String topic,
    long createdAt,
    List<DelegateResponse> delegates,
    DebateStateResponse debate) {

  public static CommitteeResponse from(Committee c) {
    return new CommitteeResponse(
        c.getId(),
        c.getName(),
        c.getTopic(),
        c.getCreatedAt(),
        c.getDelegates().stream().map(DelegateResponse::from).toList(),
        DebateStateResponse.from(c.getDebate()));
  }
}
