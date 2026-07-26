package com.example.demo.controller;

import com.example.demo.model.Message;
import com.example.demo.repository.MessageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

@Controller
public class ChatController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageRepository messageRepository;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload Message message) {
        // Save to MongoDB first
        Message savedMessage = messageRepository.save(message);

        if (message.isGroupMessage()) {
            messagingTemplate.convertAndSend("/topic/group." + message.getReceiverId(), savedMessage);
        } else {
            // Send to both sender and receiver so their UI updates
            messagingTemplate.convertAndSend("/topic/user." + message.getReceiverId(), savedMessage);
            messagingTemplate.convertAndSend("/topic/user." + message.getSenderId(), savedMessage);
        }
    }

    @MessageMapping("/chat.typing")
    public void typing(@Payload Map<String, String> payload) {
        String receiverId = payload.get("receiverId");
        messagingTemplate.convertAndSend("/topic/typing." + receiverId, payload);
    }

    @MessageMapping("/chat.editMessage")
    public void editMessage(@Payload Map<String, String> payload) {
        String messageId = payload.get("messageId");
        String newContent = payload.get("content");

        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.setContent(newContent);
            msg.setEdited(true);
            messageRepository.save(msg);

            if (msg.isGroupMessage()) {
                messagingTemplate.convertAndSend("/topic/group." + msg.getReceiverId(), msg);
            } else {
                messagingTemplate.convertAndSend("/topic/user." + msg.getReceiverId(), msg);
                messagingTemplate.convertAndSend("/topic/user." + msg.getSenderId(), msg);
            }
        });
    }

    @MessageMapping("/chat.react")
    public void react(@Payload Map<String, String> payload) {
        String messageId = payload.get("messageId");
        String emoji = payload.get("emoji");
        String userId = payload.get("userId");
        
        // Update MongoDB
        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.getReactions().put(userId, emoji);
            messageRepository.save(msg);
            
            // Broadcast update
            if (msg.isGroupMessage()) {
                messagingTemplate.convertAndSend("/topic/group." + msg.getReceiverId(), msg);
            } else {
                messagingTemplate.convertAndSend("/topic/user." + msg.getReceiverId(), msg);
                messagingTemplate.convertAndSend("/topic/user." + msg.getSenderId(), msg);
            }
        });
    }

    @MessageMapping("/chat.readReceipt")
    public void readReceipt(@Payload Map<String, String> payload) {
        String messageId = payload.get("messageId");
        
        messageRepository.findById(messageId).ifPresent(msg -> {
            msg.setStatus("READ");
            messageRepository.save(msg);
            messagingTemplate.convertAndSend("/topic/user." + msg.getSenderId(), msg);
        });
    }

    // --- WebRTC Signaling Endpoints ---

    @MessageMapping("/call.offer")
    public void sendOffer(@Payload Map<String, Object> payload) {
        String receiverId = (String) payload.get("receiverId");
        messagingTemplate.convertAndSend("/topic/call." + receiverId, payload);
    }

    @MessageMapping("/call.answer")
    public void sendAnswer(@Payload Map<String, Object> payload) {
        String receiverId = (String) payload.get("receiverId");
        messagingTemplate.convertAndSend("/topic/call." + receiverId, payload);
    }

    @MessageMapping("/call.ice")
    public void sendIceCandidate(@Payload Map<String, Object> payload) {
        String receiverId = (String) payload.get("receiverId");
        messagingTemplate.convertAndSend("/topic/call." + receiverId, payload);
    }
}
