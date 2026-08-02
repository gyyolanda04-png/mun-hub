package com.munhub.backend.config;

import com.munhub.backend.security.WebSocketAuthChannelInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

  private final WebSocketAuthChannelInterceptor authInterceptor;

  public WebSocketConfig(WebSocketAuthChannelInterceptor authInterceptor) {
    this.authInterceptor = authInterceptor;
  }

  @Override
  public void registerStompEndpoints(StompEndpointRegistry registry) {
    // Native WebSocket only (no SockJS fallback) -- @stomp/stompjs on the
    // frontend talks WebSocket directly, and modern browsers all support it.
    registry.addEndpoint("/ws").setAllowedOriginPatterns("*");
  }

  @Override
  public void configureMessageBroker(MessageBrokerRegistry registry) {
    registry.enableSimpleBroker("/topic");
  }

  @Override
  public void configureClientInboundChannel(ChannelRegistration registration) {
    registration.interceptors(authInterceptor);
  }
}
