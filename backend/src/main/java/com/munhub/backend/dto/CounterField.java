package com.munhub.backend.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum CounterField {
  SPEECHES("speeches"),
  AMENDMENTS("amendments"),
  POIS("pois");

  private final String value;

  CounterField(String value) {
    this.value = value;
  }

  @JsonValue
  public String getValue() {
    return value;
  }

  @JsonCreator
  public static CounterField fromValue(String value) {
    for (CounterField field : values()) {
      if (field.value.equalsIgnoreCase(value)) {
        return field;
      }
    }
    throw new IllegalArgumentException("Unknown counter field: " + value);
  }
}
