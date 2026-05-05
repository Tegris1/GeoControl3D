package com.backend.Model;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Username cannot be empty")
    @Size(min = 3, max = 50)
    @Column(unique = true)
    private String username;

    @NotBlank(message = "Password cannot be empty")
    @Size(min = 8)
    private String password;

    @NotBlank
    @Email(message = "Email should be valid")
    @Column(unique = true)
    private String email;

    @NotBlank
    private String role;

    @NotNull
    private Boolean isActive;

    public boolean isValidPassword(@NotBlank String rawPassword) { return false; }
    public void activate() {}
    public void deactivate() {}
    public boolean hasRole(@NotBlank String targetRole) { return false; }
}