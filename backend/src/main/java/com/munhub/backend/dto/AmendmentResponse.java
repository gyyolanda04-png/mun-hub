package com.munhub.backend.dto;

import com.munhub.backend.model.Amendment;

public record AmendmentResponse(
    String id,
    String submitterId,
    String submitter,
    String type,
    String clauseRef,
    String text,
    boolean friendly,
    String status,
    String parentId,
    long createdAt) {

  public static AmendmentResponse from(Amendment a) {
    return new AmendmentResponse(
        a.getId(),
        a.getSubmitterId(),
        a.getSubmitter() == null ? "" : a.getSubmitter(),
        a.getType().name(),
        a.getClauseRef() == null ? "" : a.getClauseRef(),
        a.getText() == null ? "" : a.getText(),
        a.isFriendly(),
        a.getStatus().name(),
        a.getParentId(),
        a.getCreatedAt());
  }
}
