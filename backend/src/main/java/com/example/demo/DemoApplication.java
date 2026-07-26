package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;
import java.util.List;

@SpringBootApplication
public class DemoApplication {

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

	@Bean
	CommandLineRunner initDatabase(UserRepository userRepository) {
		return args -> {
			if (userRepository.count() < 2) {
				System.out.println("Seeding mock users into database...");
				User sophia = new User();
				sophia.setUsername("Sophia");
				sophia.setEmail("sophia@example.com");
				sophia.setAvatarUrl("https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150");

				User alex = new User();
				alex.setUsername("Alex");
				alex.setEmail("alex@example.com");
				alex.setAvatarUrl("https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=150");

				User emily = new User();
				emily.setUsername("Emily");
				emily.setEmail("emily@example.com");
				emily.setAvatarUrl("https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150");

				User david = new User();
				david.setUsername("David");
				david.setEmail("david@example.com");
				david.setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150");
				
				userRepository.saveAll(List.of(sophia, alex, emily, david));
			}
		};
	}
}
