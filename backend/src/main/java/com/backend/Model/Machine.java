package com.backend.Model;

import lombok.*;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Table(name = "machines")
public class Machine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Hardware ID is required")
    @Column(unique = true)
    private String hardwareId;

    @NotBlank
    private String machineName;

    @NotBlank
    private String machineType;

    @PositiveOrZero
    private Double boomLength;

    @PositiveOrZero
    private Double stickLength;

    @PositiveOrZero
    private Double bucketLength;

    @NotNull private Double gnssOffsetX;
    @NotNull private Double gnssOffsetY;
    @NotNull private Double gnssOffsetZ;

    @NotNull
    @ManyToOne
    @JoinColumn(name = "owner_id")
    private User owner;

    @NotNull
    private Boolean isActive;

    public void updateDimensions(@Positive Double boom, @Positive Double stick, @Positive Double bucket) {}
    public void updateGnssOffset(@NotNull Double x, @NotNull Double y, @NotNull Double z) {}
    public void activate() {}
    public void deactivate() {}
    public Double calculateTotalArmReach() { return null; }
    public boolean isConfigurationComplete() { return false; }
}
