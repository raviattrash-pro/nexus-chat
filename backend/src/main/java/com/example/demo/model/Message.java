package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Document(collection = "messages")
public class Message {
    @Id
    private String id;
    private String senderId;
    private String receiverId; // Can be a User ID or Group ID
    private boolean isGroupMessage;

    private String content; // Text or Markdown
    private String mediaData; // Base64 for images/audio
    private String mediaType; // TEXT, IMAGE, AUDIO

    private String threadId; // For Replies / Quoting
    
    // Key: UserId, Value: Emoji string
    private Map<String, String> reactions = new HashMap<>();
    
    private boolean deleted = false; // Unsend feature
    private boolean edited = false; // Edit feature

    private Date timestamp;
    private String status; // SENT, DELIVERED, READ

    public Message() {
        this.timestamp = new Date();
        this.status = "SENT";
        this.mediaType = "TEXT";
    }

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }
    public String getReceiverId() { return receiverId; }
    public void setReceiverId(String receiverId) { this.receiverId = receiverId; }
    public boolean isGroupMessage() { return isGroupMessage; }
    public void setGroupMessage(boolean groupMessage) { isGroupMessage = groupMessage; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getMediaData() { return mediaData; }
    public void setMediaData(String mediaData) { this.mediaData = mediaData; }
    public String getMediaType() { return mediaType; }
    public void setMediaType(String mediaType) { this.mediaType = mediaType; }
    public String getThreadId() { return threadId; }
    public void setThreadId(String threadId) { this.threadId = threadId; }
    public Map<String, String> getReactions() { return reactions; }
    public void setReactions(Map<String, String> reactions) { this.reactions = reactions; }
    public boolean isDeleted() { return deleted; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
    public boolean isEdited() { return edited; }
    public void setEdited(boolean edited) { this.edited = edited; }
    public Date getTimestamp() { return timestamp; }
    public void setTimestamp(Date timestamp) { this.timestamp = timestamp; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
