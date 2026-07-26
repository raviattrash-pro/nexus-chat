package com.example.demo.controller;

import com.example.demo.model.SavedItem;
import com.example.demo.model.User;
import com.example.demo.repository.MessageRepository;
import com.example.demo.repository.SavedItemRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.Group;
import com.example.demo.repository.GroupRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.geo.Distance;
import org.springframework.data.geo.Metrics;
import org.springframework.data.geo.Point;

import java.util.List;

@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "*")
public class ApiController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SavedItemRepository savedItemRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private GroupRepository groupRepository;

    // --- USER ENDPOINTS ---
    
    @PostMapping("/users")
    public ResponseEntity<User> createUser(@RequestBody User user) {
        List<User> existing = userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase("", user.getEmail());
        for (User u : existing) {
            if (u.getEmail().equalsIgnoreCase(user.getEmail())) {
                u.setAvatarUrl(user.getAvatarUrl()); // update avatar just in case
                u.setUsername(user.getUsername());
                return ResponseEntity.ok(userRepository.save(u));
            }
        }
        return ResponseEntity.ok(userRepository.save(user));
    }

    @GetMapping("/users/{userId}/following")
    public ResponseEntity<List<User>> getFollowing(@PathVariable String userId) {
        return userRepository.findById(userId).map(user -> {
            List<User> following = new java.util.ArrayList<>();
            for (String fId : user.getFollowingIds()) {
                userRepository.findById(fId).ifPresent(following::add);
            }
            return ResponseEntity.ok(following);
        }).orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/users/search")
    public ResponseEntity<List<User>> searchUsers(@RequestParam String query) {
        return ResponseEntity.ok(userRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query));
    }

    @GetMapping("/users/nearby")
    public ResponseEntity<List<User>> getNearbyUsers(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "10") double radiusKm) {
        Point location = new Point(lng, lat); // GeoJSON format uses (longitude, latitude)
        Distance distance = new Distance(radiusKm, Metrics.KILOMETERS);
        return ResponseEntity.ok(userRepository.findByLocationNear(location, distance));
    }

    @PostMapping("/users/{userId}/saved-items")
    public ResponseEntity<User> saveItem(@PathVariable String userId, @RequestBody com.example.demo.model.SavedItem item) {
        return userRepository.findById(userId).map(user -> {
            if (item.getId() == null) {
                item.setId(java.util.UUID.randomUUID().toString());
            }
            user.getSavedItems().add(item);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/users/{userId}/saved-items/{itemId}")
    public ResponseEntity<User> deleteSavedItem(@PathVariable String userId, @PathVariable String itemId) {
        return userRepository.findById(userId).map(user -> {
            user.getSavedItems().removeIf(item -> item.getId().equals(itemId));
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{userId}/follow/{targetId}")
    public ResponseEntity<User> followUser(@PathVariable String userId, @PathVariable String targetId) {
        return userRepository.findById(userId).map(user -> {
            user.getFollowingIds().add(targetId);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/users/{userId}/unfollow/{targetId}")
    public ResponseEntity<User> unfollowUser(@PathVariable String userId, @PathVariable String targetId) {
        return userRepository.findById(userId).map(user -> {
            user.getFollowingIds().remove(targetId);
            return ResponseEntity.ok(userRepository.save(user));
        }).orElse(ResponseEntity.notFound().build());
    }

    // --- SAVED ITEMS ENDPOINTS ---

    @PostMapping("/saved-items")
    public ResponseEntity<SavedItem> saveItem(@RequestBody SavedItem item) {
        return ResponseEntity.ok(savedItemRepository.save(item));
    }

    @GetMapping("/saved-items/{userId}")
    public ResponseEntity<List<SavedItem>> getSavedItems(@PathVariable String userId) {
        return ResponseEntity.ok(savedItemRepository.findByUserIdOrderByCreatedAtDesc(userId));
    }

    // --- MESSAGE HISTORY ENDPOINTS ---

    @GetMapping("/messages/{userId1}/{userId2}")
    public ResponseEntity<?> getChatHistory(@PathVariable String userId1, @PathVariable String userId2) {
        return ResponseEntity.ok(
            messageRepository.findBySenderIdAndReceiverIdOrSenderIdAndReceiverIdOrderByTimestampAsc(
                userId1, userId2, userId2, userId1
            )
        );
    }

    // --- GROUP / WORKSPACE ENDPOINTS ---

    @PostMapping("/groups")
    public ResponseEntity<Group> createGroup(@RequestBody Group group) {
        return ResponseEntity.ok(groupRepository.save(group));
    }

    @GetMapping("/groups/user/{userId}")
    public ResponseEntity<List<Group>> getUserGroups(@PathVariable String userId) {
        return ResponseEntity.ok(groupRepository.findByMemberIdsContaining(userId));
    }
}
