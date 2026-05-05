package com.backend.Service;

import com.backend.Model.Machine;
import com.backend.Model.User;
import jakarta.validation.constraints.*;
import org.springframework.validation.annotation.Validated;
import java.util.List;

@Validated
public interface MachineService {
    Machine registerMachine(
            @NotBlank String hardwareId,
            @NotBlank String machineName,
            @NotBlank String machineType,
            @NotNull User owner
    );

    Machine updateMachineSpecifications(
            @NotNull Long machineId,
            @Positive Double boom,
            @Positive Double stick,
            @Positive Double bucket
    );

    Machine updateGnssOffset(@NotNull Long machineId, @NotNull Double x, @NotNull Double y, @NotNull Double z);
    //HardwareVerificationResponse verifyHardwareId(@NotBlank String hardwareId);
    Machine getMachineById(@NotNull Long machineId);
    Machine getMachineByHardwareId(@NotBlank String hardwareId);
    List<Machine> getUserMachines(@NotNull User user);
    void deactivateMachine(@NotNull Long machineId);
    boolean isHardwareIdValid(@NotBlank String hardwareId);
}