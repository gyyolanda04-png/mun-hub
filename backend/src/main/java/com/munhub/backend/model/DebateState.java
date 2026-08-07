package com.munhub.backend.model;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Embeddable;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import java.util.ArrayList;
import java.util.List;

/** Mirrors the DebateState interface in the frontend's lib/types.ts. */
@Embeddable
public class DebateState {

  private int totalDuration = 180;
  private int resolutions = 2;

  // Reuse the pre-rename columns so existing committees keep their values and
  // don't hit NULL-into-primitive load errors (Hibernate ddl-auto=update won't
  // backfill a freshly-added column).
  @Column(name = "opening_ceremony")
  private int openingSpeech = 15;

  @Column(name = "closing_ceremony")
  private int closingSpeech = 15;

  private int amendmentsPerResolution = 3;

  @Enumerated(EnumType.STRING)
  private DebateStage stage = DebateStage.OPENING;

  private int currentResolution = 1;
  private int currentAmendment = 1;

  @Column(name = "current_speaker_id")
  private String currentSpeakerId;

  @ElementCollection
  @CollectionTable(name = "debate_speaker_queue", joinColumns = @JoinColumn(name = "committee_id"))
  @OrderColumn(name = "queue_position")
  @Column(name = "delegate_id")
  private List<String> speakerQueue = new ArrayList<>();

  public int getTotalDuration() {
    return totalDuration;
  }

  public void setTotalDuration(int totalDuration) {
    this.totalDuration = totalDuration;
  }

  public int getResolutions() {
    return resolutions;
  }

  public void setResolutions(int resolutions) {
    this.resolutions = resolutions;
  }

  public int getOpeningSpeech() {
    return openingSpeech;
  }

  public void setOpeningSpeech(int openingSpeech) {
    this.openingSpeech = openingSpeech;
  }

  public int getClosingSpeech() {
    return closingSpeech;
  }

  public void setClosingSpeech(int closingSpeech) {
    this.closingSpeech = closingSpeech;
  }

  public int getAmendmentsPerResolution() {
    return amendmentsPerResolution;
  }

  public void setAmendmentsPerResolution(int amendmentsPerResolution) {
    this.amendmentsPerResolution = amendmentsPerResolution;
  }

  public DebateStage getStage() {
    return stage;
  }

  public void setStage(DebateStage stage) {
    this.stage = stage;
  }

  public int getCurrentResolution() {
    return currentResolution;
  }

  public void setCurrentResolution(int currentResolution) {
    this.currentResolution = currentResolution;
  }

  public int getCurrentAmendment() {
    return currentAmendment;
  }

  public void setCurrentAmendment(int currentAmendment) {
    this.currentAmendment = currentAmendment;
  }

  public String getCurrentSpeakerId() {
    return currentSpeakerId;
  }

  public void setCurrentSpeakerId(String currentSpeakerId) {
    this.currentSpeakerId = currentSpeakerId;
  }

  public List<String> getSpeakerQueue() {
    return speakerQueue;
  }

  public void setSpeakerQueue(List<String> speakerQueue) {
    this.speakerQueue = speakerQueue != null ? speakerQueue : new ArrayList<>();
  }
}
