package com.munhub.backend.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/** Mirrors the DebateStage union type in the frontend's lib/types.ts. */
public enum DebateStage {
  OPENING("opening"),
  GENERAL("general"),
  RESOLUTION("resolution"),
  AMENDMENT("amendment"),
  VOTING("voting"),
  CLOSING("closing");

  private final String value;

  DebateStage(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  @JsonCreator
  public static DebateStage fromValue(String value) {
    for (DebateStage stage : values()) {
      if (stage.value.equalsIgnoreCase(value)) {
        return stage;
      }
    }
    throw new IllegalArgumentException("Unknown debate stage: " + value);
  }
}
