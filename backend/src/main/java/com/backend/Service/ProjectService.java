package com.backend.Service;

import com.backend.Model.Project;
import com.backend.Model.User;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@Validated
public interface ProjectService {
    Project createProject(
            @NotBlank String projectName,
            String description,
            @Min(-90) @Max(90) Double lat,
            @Min(-180) @Max(180) Double lon,
            @NotNull User creator
    );

    Project getProjectById(@NotNull Long projectId);
    List<Project> getUserProjects(@NotNull User user);
    Project updateProject(@NotNull Long projectId, @NotBlank String projectName, String description);
    Project updateProjectLocation(@NotNull Long projectId, @Min(-90) @Max(90) Double lat, @Min(-180) @Max(180) Double lon);
    void deleteProject(@NotNull Long projectId);
    List<Project> searchProjects(@NotBlank String keyword);
    boolean canUserModifyProject(@NotNull Long projectId, @NotNull User user);
}