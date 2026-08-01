package com.munhub.backend.controller;

import com.munhub.backend.dto.AddDelegatesRequest;
import com.munhub.backend.dto.CommitteeResponse;
import com.munhub.backend.dto.CreateCommitteeRequest;
import com.munhub.backend.dto.IncrementCounterRequest;
import com.munhub.backend.model.Committee;
import com.munhub.backend.service.CommitteeService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/committees")
public class CommitteeController {

  private final CommitteeService committeeService;

  public CommitteeController(CommitteeService committeeService) {
    this.committeeService = committeeService;
  }

  @GetMapping
  public List<CommitteeResponse> listCommittees() {
    return committeeService.listCommittees().stream().map(CommitteeResponse::from).toList();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public CommitteeResponse createCommittee(@Valid @RequestBody CreateCommitteeRequest request) {
    Committee committee = committeeService.createCommittee(request.name(), request.topic());
    return CommitteeResponse.from(committee);
  }

  @GetMapping("/{id}")
  public CommitteeResponse getCommittee(@PathVariable String id) {
    return CommitteeResponse.from(committeeService.getCommittee(id));
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteCommittee(@PathVariable String id) {
    committeeService.deleteCommittee(id);
  }

  @PostMapping("/{id}/delegates")
  public CommitteeResponse addDelegates(
      @PathVariable String id, @Valid @RequestBody AddDelegatesRequest request) {
    Committee committee = committeeService.addDelegates(id, request.delegates());
    return CommitteeResponse.from(committee);
  }

  @DeleteMapping("/{id}/delegates/{delegateId}")
  public CommitteeResponse removeDelegate(@PathVariable String id, @PathVariable String delegateId) {
    Committee committee = committeeService.removeDelegate(id, delegateId);
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/delegates/{delegateId}/counter")
  public CommitteeResponse incrementCounter(
      @PathVariable String id,
      @PathVariable String delegateId,
      @Valid @RequestBody IncrementCounterRequest request) {
    Committee committee =
        committeeService.incrementCounter(id, delegateId, request.field(), request.delta());
    return CommitteeResponse.from(committee);
  }

  @PatchMapping("/{id}/debate")
  public CommitteeResponse updateDebate(@PathVariable String id, @RequestBody Map<String, Object> patch) {
    Committee committee = committeeService.updateDebate(id, patch);
    return CommitteeResponse.from(committee);
  }
}
