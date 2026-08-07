package com.munhub.backend.dto;

/**
 * Create an amendment. All fields optional except they usually come together;
 * `parentId` set means this is a second-degree amendment (amends another).
 */
public record CreateAmendmentRequest(
    String submitterId,
    String type,
    String clauseRef,
    String text,
    Boolean friendly,
    String parentId) {}
