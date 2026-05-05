package com.backend.Service;

import com.backend.Model.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;

@Validated
public interface AuthService {
    /*AuthResponse login(@Valid @NotNull AuthRequest authRequest);

    AuthResponse register(
            @NotBlank @Size(min = 3) String username,
            @NotBlank @Email String email,
            @NotBlank @Size(min = 8) String password
    );*/

    //AuthResponse refreshToken(@NotBlank String refreshToken);
    void logout(@NotBlank String token);
    User getCurrentUser();
    boolean validateToken(@NotBlank String token);
    void changePassword(@NotNull Long userId, @NotBlank String oldPassword, @NotBlank String newPassword);
}