package com.munhub.backend.dto;

import com.munhub.backend.model.Delegate;
import java.util.Map;

public record DelegateResponse(
    String id,
    String delegation,
    String name,
    String school,
    String email,
    String bloc,
    int speeches,
    int amendments,
    int pois,
    Map<String, Boolean> attendance) {

  public static DelegateResponse from(Delegate d) {
    return new DelegateResponse(
        d.getId(),
        d.getDelegation() == null ? "" : d.getDelegation(),
        d.getName(),
        d.getSchool(),
        d.getEmail(),
        d.getBloc() == null ? "" : d.getBloc(),
        d.getSpeeches(),
        d.getAmendments(),
        d.getPois(),
        d.getAttendance());
  }
}
