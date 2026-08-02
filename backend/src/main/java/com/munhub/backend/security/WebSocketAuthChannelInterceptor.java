package com.munhub.backend.security;

import com.munhub.backend.model.User;
import com.munhub.backend.repository.CommitteeRepository;
import com.munhub.backend.service.AuthService;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.lang.NonNull;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

/**
 * Authenticates STOMP connections and authorizes topic subscriptions.
 *
 * <p>Auth happens at CONNECT (reading an "Authorization" STOMP header sent
 * inside the already-open WebSocket connection) rather than at the HTTP
 * handshake, because browsers' WebSocket API can't set custom HTTP headers
 * on the upgrade request. The resolved user id is stashed in the STOMP
 * session's attributes so SUBSCRIBE frames on the same connection can check
 * committee membership before allowing a subscription to
 * /topic/committees/{id}.
 */
@Component
public class WebSocketAuthChannelInterceptor implements ChannelInterceptor {

  private static final Pattern COMMITTEE_TOPIC = Pattern.compile("^/topic/committees/([^/]+)$");

  private final AuthService authService;
  private final CommitteeRepository committeeRepository;

  public WebSocketAuthChannelInterceptor(AuthService authService, CommitteeRepository committeeRepository) {
    this.authService = authService;
    this.committeeRepository = committeeRepository;
  }

  @Override
  public Message<?> preSend(@NonNull Message<?> message, @NonNull MessageChannel channel) {
    StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
    if (accessor == null || accessor.getCommand() == null) {
      return message;
    }

    if (accessor.getCommand() == StompCommand.CONNECT) {
      handleConnect(accessor);
    } else if (accessor.getCommand() == StompCommand.SUBSCRIBE) {
      handleSubscribe(accessor);
    }

    return message;
  }

  private void handleConnect(StompHeaderAccessor accessor) {
    String header = accessor.getFirstNativeHeader("Authorization");
    if (header == null || !header.startsWith("Bearer ")) {
      throw new AccessDeniedException("Missing Authorization header on CONNECT");
    }
    String token = header.substring("Bearer ".length()).trim();
    User user = authService.resolveToken(token).orElseThrow(() -> new AccessDeniedException("Invalid token"));
    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
    if (sessionAttributes != null) {
      sessionAttributes.put("userId", user.getId());
    }
  }

  private void handleSubscribe(StompHeaderAccessor accessor) {
    Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
    String userId = sessionAttributes != null ? (String) sessionAttributes.get("userId") : null;
    if (userId == null) {
      throw new AccessDeniedException("Not authenticated");
    }
    String destination = accessor.getDestination();
    if (destination == null) {
      return;
    }
    Matcher matcher = COMMITTEE_TOPIC.matcher(destination);
    if (matcher.matches()) {
      String committeeId = matcher.group(1);
      if (!committeeRepository.isMember(committeeId, userId)) {
        throw new AccessDeniedException("Not a member of committee " + committeeId);
      }
    }
  }
}
