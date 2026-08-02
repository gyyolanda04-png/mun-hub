package com.munhub.backend.dto;

import com.munhub.backend.model.Committee;

/** Broadcast to /topic/committees/{committeeId} whenever that committee changes. */
public record CommitteeWsEvent(String type, CommitteeResponse committee, String committeeId) {

  public static CommitteeWsEvent updated(Committee c) {
    return new CommitteeWsEvent("updated", CommitteeResponse.from(c), c.getId());
  }

  public static CommitteeWsEvent deleted(String committeeId) {
    return new CommitteeWsEvent("deleted", null, committeeId);
  }
}
