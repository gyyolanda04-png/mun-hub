package com.munhub.backend.dto;

import com.munhub.backend.model.Delegate;

public record DelegateResponse(
    String id, String name, String school, String email, int speeches, int amendments, int pois) {

  public static DelegateResponse from(Delegate d) {
    return new DelegateResponse(
        d.getId(), d.getName(), d.getSchool(), d.getEmail(), d.getSpeeches(), d.getAmendments(), d.getPois());
  }
}
