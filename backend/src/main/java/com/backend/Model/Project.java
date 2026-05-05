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
@Table(name = "projects")
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Project name is required")
    @Size(max = 100)
    private String projectName;

    @Size(max = 500)
    private String description;

    @Min(-90) @Max(90)
    private Double locationLat;

    @Min(-180) @Max(180)
    private Double locationLon;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "creator_id")
    private User creator;

    private LocalDateTime createdAt;

    public void updateLocation(@Min(-90) @Max(90) Double lat, @Min(-180) @Max(180) Double lon) {}
    public boolean isOwnedBy(@NotNull User user) { return false; }
    public boolean hasValidLocation() { return false; }
}