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
  private int openingCeremony = 15;
  private int closingCeremony = 15;
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

  public int getOpeningCeremony() {
    return openingCeremony;
  }

  public void setOpeningCeremony(int openingCeremony) {
    this.openingCeremony = openingCeremony;
  }

  public int getClosingCeremony() {
    return closingCeremony;
  }

  public void setClosingCeremony(int closingCeremony) {
    this.closingCeremony = closingCeremony;
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
