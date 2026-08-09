package com.munhub.backend.dto;

import com.munhub.backend.model.Note;

public record NoteResponse(String id, String text, long createdAt, long updatedAt) {

  public static NoteResponse from(Note n) {
    return new NoteResponse(
        n.getId(), n.getText() == null ? "" : n.getText(), n.getCreatedAt(), n.getUpdatedAt());
  }
}
