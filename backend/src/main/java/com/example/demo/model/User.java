package com.example.demo.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexed;
import org.springframework.data.mongodb.core.mapping.Document;
import java.util.List;
import java.util.ArrayList;

@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String email;
    private String username;
    private String avatarUrl;
    private String status = "ONLINE"; // ONLINE, AWAY, DND
    private java.util.Set<String> followingIds = new java.util.HashSet<>();
    private List<SavedItem> savedItems = new ArrayList<>();

    // Geospatial data for "Find Nearby"
    @GeoSpatialIndexed(type = GeoSpatialIndexType.GEO_2DSPHERE)
    private GeoJsonPoint location;

    public User() {}

    public User(String email, String username, String avatarUrl) {
        this.email = email;
        this.username = username;
        this.avatarUrl = avatarUrl;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<SavedItem> getSavedItems() { return savedItems; }
    public void setSavedItems(List<SavedItem> savedItems) { this.savedItems = savedItems; }
    public java.util.Set<String> getFollowingIds() { return followingIds; }
    public void setFollowingIds(java.util.Set<String> followingIds) { this.followingIds = followingIds; }
    public GeoJsonPoint getLocation() { return location; }
    public void setLocation(GeoJsonPoint location) { this.location = location; }
}
