package com.backend.Service;

import com.backend.Model.MapDwg;
import com.backend.Model.MapTin;
import jakarta.validation.constraints.NotNull;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;

@Validated
public interface MapConversionService {
    MapDwg uploadDwgFile(@NotNull MultipartFile file, @NotNull Long projectId, @NotNull Long userId);
    MapTin convertDwgToTin(@NotNull Long dwgId);
    boolean validateDwgFile(@NotNull MultipartFile file);
    MapDwg getDwgById(@NotNull Long dwgId);
    MapTin getTinById(@NotNull Long tinId);
    List<MapTin> getProjectTinModels(@NotNull Long projectId);
    void deleteModel(@NotNull Long tinId);
    MapTin getActiveTinModelForProject(@NotNull Long projectId);
}