import {
    JOINT_VELOCITIES,
    JOINT_INCREMENTS,
    ValidJoints,
    ValidJointStateDict,
} from "shared/util";
import { ActionMode } from "../utils/component_definitions";
import { FunctionProvider } from "./FunctionProvider";

/** Each of the possible key controls */
export type KeyControls =
    | "STEP_SLOW"
    | "STEP_MEDIUM"
    | "STEP_FAST"
    | "BASE_FORWARD"
    | "BASE_LEFT"
    | "BASE_BACK"
    | "BASE_RIGHT"
    | "ARM_UP"
    | "ARM_IN"
    | "ARM_DOWN"
    | "ARM_OUT"
    | "GRIPPER_FORWARD"
    | "GRIPPER_CLOSE"
    | "GRIPPER_BACK"
    | "GRIPPER_OPEN"
    | "HEAD_UP"
    | "HEAD_LEFT"
    | "HEAD_DOWN"
    | "HEAD_RIGHT"
    | "QUIT";

export type KeyBindings = Partial<Record<KeyControls, string>>;
export enum KeyState {
    Active,
    Inactive,
}   

/** Array of the pan tilt keys */
export const panTiltKeys: KeyControls[] = [
    "HEAD_UP",
    "HEAD_DOWN",
    "HEAD_LEFT",
    "HEAD_RIGHT",
];

/** key functions which require moving a joint in the negative direction. */
const negativeKeyPadFunctions = new Set<KeyControls>([
    "BASE_BACK",
    "BASE_RIGHT",
    "ARM_DOWN",
    "ARM_IN",
    "GRIPPER_CLOSE",
    "HEAD_DOWN",
    "HEAD_LEFT",
]);

/** Map KeyControls to joint names and direction */
function getJointNameFromKeyControl(
    control: KeyControls
): { joint: ValidJoints; isNegative: boolean } {
    const isNegative = negativeKeyPadFunctions.has(control);
    
    switch (control) {
        case "BASE_BACK":
        case "BASE_FORWARD":
            return { joint: "translate_mobile_base", isNegative };

        case "BASE_LEFT":
        case "BASE_RIGHT":
            return { joint: "rotate_mobile_base", isNegative };

        case "ARM_DOWN":
        case "ARM_UP":
            return { joint: "joint_lift", isNegative };

        case "ARM_IN":
        case "ARM_OUT":
            return { joint: "wrist_extension", isNegative };

        case "GRIPPER_CLOSE":
        case "GRIPPER_OPEN":
            return { joint: "joint_gripper_finger_left", isNegative };

        case "GRIPPER_FORWARD":
        case "GRIPPER_BACK":
            return { joint: "joint_wrist_yaw", isNegative };

        case "HEAD_LEFT":
        case "HEAD_RIGHT":
            return { joint: "joint_head_pan", isNegative };

        case "HEAD_UP":
        case "HEAD_DOWN":
            return { joint: "joint_head_tilt", isNegative };

        default:
            throw Error(`unknown key control: ${control}`);
    }
}

/** Get velocity or increment amount based on step size control */
function getStepSize(currentStepControl: KeyControls | undefined): number {
    switch (currentStepControl) {
        case "STEP_FAST":
            return 0.1;
        case "STEP_MEDIUM":
            return 0.05;
        case "STEP_SLOW":
        default:
            return 0.02;
    }
}

/**
 * Keyboard function provider - handles keyboard control of the robot
 */
export class KeyboardFunctionProvider extends FunctionProvider {
    private currentActiveKeys = new Set<KeyControls>();
    private currentStepControl: KeyControls = "STEP_SLOW";

    /**
     * Handle a key state change (active or inactive)
     * @param control which control changed
     * @param state new state (Active or Inactive)
     */
    public handleKeyStateChange(control: KeyControls, state: KeyState) {
        if (state === KeyState.Active) {
            if (control.startsWith("STEP_")) {
                this.currentStepControl = control;
                return;
            }

            this.currentActiveKeys.add(control);
            this.executeKeyboardAction(control);
        }else {
            this.currentActiveKeys.delete(control);

            if (control === "QUIT") {
                return;
            }

            if (!this.hasActiveKeyForJoint(control)) {
                this.stopCurrentAction(true);
            }
        }
    }

    /**
     * Execute the robot action for the given keyboard control
     */
    private executeKeyboardAction(control: KeyControls) {
        // Handle step size controls (these are metadata, not actions)
        if (control.startsWith("STEP_")) return;

        // Handle quit
        if (control === "QUIT") {
            this.stopCurrentAction(true);
            return;
        }

        // Get the joint and direction for this control
        const { joint, isNegative } = getJointNameFromKeyControl(control);

        // Determine step size from STEP_* controls
        const stepSize = getStepSize(this.currentStepControl);

        // Determine velocity direction
        const velocity = isNegative ? -stepSize : stepSize;

        // Execute continuous movement
        this.continuousJointMovement(joint, velocity);
    }

    /**
     * Check if there's still an active key for the given joint
     */
    private hasActiveKeyForJoint(control: KeyControls): boolean {
        const { joint } = getJointNameFromKeyControl(control);
        
        return Array.from(this.currentActiveKeys).some(key => {
            try {
                const { joint: otherJoint } = getJointNameFromKeyControl(key);
                return otherJoint === joint;
            } catch {
                return false;
            }
        });
    }
}