package com.example.demo.model;

import java.util.UUID;

public class SavedItem {
    private String id;
    private String type; // TEXT, IMAGE, PDF
    private String content; // text content or base64 data url

    public SavedItem() {
        this.id = UUID.randomUUID().toString();
    }

    public SavedItem(String type, String content) {
        this.id = UUID.randomUUID().toString();
        this.type = type;
        this.content = content;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}
