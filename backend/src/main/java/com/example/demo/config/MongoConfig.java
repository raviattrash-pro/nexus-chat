package com.example.demo.config;

import com.mongodb.ConnectionString;
import com.mongodb.MongoClientSettings;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractMongoClientConfiguration;

@Configuration
public class MongoConfig extends AbstractMongoClientConfiguration {

    @Override
    protected String getDatabaseName() {
        return "nexuschat";
    }

    @Override
    public MongoClient mongoClient() {
        // Hardcoding the connection string to bypass any properties file caching issues
        ConnectionString connectionString = new ConnectionString("mongodb+srv://RavPd:RavPd%40%40%23%5E%26@cluster0.0dl4mgm.mongodb.net/nexuschat?appName=Cluster0");
        MongoClientSettings mongoClientSettings = MongoClientSettings.builder()
            .applyConnectionString(connectionString)
            .build();
        return MongoClients.create(mongoClientSettings);
    }
}
