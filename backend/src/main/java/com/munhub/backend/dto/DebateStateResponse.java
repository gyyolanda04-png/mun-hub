package com.munhub.backend.dto;

import com.munhub.backend.model.DebateStage;
import com.munhub.backend.model.DebateState;
import java.util.List;

public record DebateStateResponse(
    int totalDuration,
    int resolutions,
    int openingSpeech,
    int closingSpeech,
    int amendmentsPerResolution,
    DebateStage stage,
    int currentResolution,
    int currentAmendment,
    String currentSpeakerId,
    List<String> speakerQueue) {

  public static DebateStateResponse from(DebateState d) {
    return new DebateStateResponse(
        d.getTotalDuration(),
        d.getResolutions(),
        d.getOpeningSpeech(),
        d.getClosingSpeech(),
        d.getAmendmentsPerResolution(),
        d.getStage(),
        d.getCurrentResolution(),
        d.getCurrentAmendment(),
        d.getCurrentSpeakerId(),
        d.getSpeakerQueue());
  }
}
