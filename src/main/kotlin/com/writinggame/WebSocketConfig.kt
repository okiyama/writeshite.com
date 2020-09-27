package com.writinggame

import com.writinggame.controller.viewModels.JoinGameResponse
import com.writinggame.model.LobbyManager
import org.apache.catalina.Context
import org.apache.catalina.connector.Connector
import org.apache.tomcat.util.descriptor.web.SecurityCollection
import org.apache.tomcat.util.descriptor.web.SecurityConstraint
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.event.EventListener
import org.springframework.messaging.simp.SimpMessageSendingOperations
import org.springframework.messaging.simp.config.MessageBrokerRegistry
import org.springframework.messaging.simp.stomp.StompHeaderAccessor
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker
import org.springframework.web.socket.config.annotation.StompEndpointRegistry
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer
import org.springframework.web.socket.messaging.SessionDisconnectEvent
import java.time.ZonedDateTime


@Configuration
@EnableWebSocketMessageBroker
class WebSocketConfig : WebSocketMessageBrokerConfigurer {

    @Autowired
    lateinit var messagingTemplate: SimpMessageSendingOperations;

    override fun configureMessageBroker(registry: MessageBrokerRegistry) {
        registry.enableSimpleBroker("/topic/", "/user/", "/queue/")
        registry.setApplicationDestinationPrefixes("/app")
    }

    override fun registerStompEndpoints(registry: StompEndpointRegistry) {
        registry.addEndpoint("/websocket").withSockJS()
    }

    @EventListener
    fun onSocketDisconnected(event: SessionDisconnectEvent) {
        val sha = StompHeaderAccessor.wrap(event.message)
        if (sha.sessionId != null) {
            val receivedDatetime = ZonedDateTime.now()
            val lobby = LobbyManager.leaveLobby(sha.sessionId!!)
            if (lobby != null) {
                messagingTemplate.convertAndSend(
                        "/topic/lobby.${lobby.lobbyId}",
                        JoinGameResponse(lobby, receivedDatetime)
                )
            }
        }
        println("[Disconnected] " + sha.sessionId)
    }

    @Bean
    fun servletContainer(): TomcatServletWebServerFactory {
        val httpConnector1 = Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL)
        httpConnector1.scheme = "http"
        httpConnector1.port = 8080
        httpConnector1.secure = false
        httpConnector1.redirectPort = 443

        val httpConnector2 = Connector(TomcatServletWebServerFactory.DEFAULT_PROTOCOL)
        httpConnector2.scheme = "http"
        httpConnector2.port = 80
        httpConnector2.secure = false
        httpConnector2.redirectPort = 443

        val tomcat = object : TomcatServletWebServerFactory() {
            override fun postProcessContext(context: Context?) {
                super.postProcessContext(context)
                val securityConstraint = SecurityConstraint()
                securityConstraint.userConstraint = "CONFIDENTIAL"

                val collection = SecurityCollection()
                collection.addPattern("/*")
                securityConstraint.addCollection(collection)
                context?.addConstraint(securityConstraint)
            }
        }
        tomcat.addAdditionalTomcatConnectors(httpConnector1, httpConnector2)

        return tomcat;
    }
}