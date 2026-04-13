import React from "react";
import {
    CustomizableComponentProps,
    isSelected,
} from "./CustomizableComponent";

const TELEOP_CONTROLS = [
    // Step Sizes
    "SLOW",
    "MEDIUM",
    "FAST",
    
    // Base
    "BASE_FORWARD",
    "BASE_LEFT",
    "BASE_BACK",
    "BASE_RIGHT",

    // Arm
    "ARM_UP", 
    "ARM_IN",
    "ARM_DOWN",
    "ARM_OUT",

    // Gripper
    "GRIPPER_FORWARD",
    "GRIPPER_CLOSE",
    "GRIPPER_BACK",
    "GRIPPER_OPEN",

    // Head
    "HEAD_UP",
    "HEAD_LEFT",
    "HEAD_DOWN",
    "HEAD_RIGHT",

    // Quit
    "QUIT",
];

/**
 * Component for keyboard teleoperation controls
 * @note For now, this component is just a placeholder that lists the controls that will be implemented.
 *       The actual implementation of the keyboard teleop controls will be added in a future PR.
 */
export const KeyboardTeleop = (props: CustomizableComponentProps) => {
    if (!props.definition.type) {
        throw new Error(`Component at ${props.path} is missing type`);
    }

    return (
        <div className="keyboard-teleop">
            <h2>Keyboard Teleoperation Controls</h2>
            <h3>Binding keys...</h3>
            
            {/* <ul>
                {TELEOP_CONTROLS.map((control) => (
                    <li key={control}>{control}</li>
                ))}
            </ul> */}
        </div>
    );
}
