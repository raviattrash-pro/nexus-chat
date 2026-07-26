package com.example.demo.repository;

import com.example.demo.model.SavedItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedItemRepository extends MongoRepository<SavedItem, String> {
    List<SavedItem> findByUserIdOrderByCreatedAtDesc(String userId);
}
