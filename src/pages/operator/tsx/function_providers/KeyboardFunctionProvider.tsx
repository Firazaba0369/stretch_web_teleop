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

/** Array of the pan tilt keys */
export const panTiltKeys: KeyControls[] = [
    "HEAD_UP",
    "HEAD_DOWN",
    "HEAD_LEFT",
    "HEAD_RIGHT",
];

/** Key functions which require moving a joint in the negative direction. */
const negativeKeyPadFunctions = new Set<KeyControls>([
    "BASE_BACK",
    "BASE_RIGHT",
    "ARM_DOWN",
    "ARM_IN",
    "GRIPPER_CLOSE",
    "HEAD_DOWN",
    "HEAD_RIGHT",
]);

/** Function provider for the keyboard teleop component. */
export class KeyboardFunctionProvider extends FunctionProvider {
    private keyBindings: KeyBindings = {};

    constructor() {
        super();
        this.provideFunctions = this.provideFunctions.bind(this);
    }

    /**
     * Takes a physical key press string, resolves it to a `KeyControls`,
     * and returns functions that call the movement helpers on this provider.
     *
     * - StepActions → incremental* helpers
     * - PressAndHold → continuous* helpers, stop on release
     * - ClickClick → toggle continuous action on click
     */
    public provideFunctions(keyPress: string) {
        const keyControl = this.resolveKeyControl(keyPress);
        if (!keyControl) return { onClick: () => {} };

        let action: () => void;
        const jointName: ValidJoints = getJointNameFromKeyFunction(keyControl);
        const multiplier: number = negativeKeyPadFunctions.has(keyControl)
            ? -1
            : 1;
        const velocity =
            multiplier *
            JOINT_VELOCITIES[jointName]! *
            FunctionProvider.velocityScale;
        const increment =
            multiplier *
            JOINT_INCREMENTS[jointName]! *
            FunctionProvider.velocityScale;

        const onLeave = () => {
            this.stopCurrentAction();
        };

        switch (FunctionProvider.actionMode) {
            case ActionMode.StepActions:
                switch (keyControl) {
                    case "BASE_FORWARD":
                    case "BASE_BACK":
                        action = () => this.incrementalBaseDrive(velocity, 0.0);
                        break;
                    case "BASE_LEFT":
                    case "BASE_RIGHT":
                        action = () => this.incrementalBaseDrive(0.0, velocity);
                        break;
                    case "ARM_DOWN":
                    case "ARM_UP":
                    case "ARM_IN":
                    case "ARM_OUT":
                    case "GRIPPER_FORWARD":
                    case "GRIPPER_BACK":
                    case "GRIPPER_OPEN":
                    case "GRIPPER_CLOSE":
                        action = () =>
                            this.incrementalJointMovement(jointName, increment);
                        break;
                    case "HEAD_UP":
                    case "HEAD_DOWN":
                    case "HEAD_LEFT":
                    case "HEAD_RIGHT":
                        action = () => {
                            this.incrementalJointMovement(jointName, increment);
                            FunctionProvider.remoteRobot?.setToggle(
                                "setFollowGripper",
                                false,
                            );
                        };
                        break;
                    default:
                        action = () => {};
                }
                return {
                    onClick: () => {
                        action();
                    },
                    onLeave,
                };

            case ActionMode.PressAndHold:
            case ActionMode.ClickClick:
                switch (keyControl) {
                    case "BASE_FORWARD":
                    case "BASE_BACK":
                        action = () => this.continuousBaseDrive(velocity, 0.0);
                        break;
                    case "BASE_LEFT":
                    case "BASE_RIGHT":
                        action = () => this.continuousBaseDrive(0.0, velocity);
                        break;
                    default:
                        action = () => this.continuousJointMovement(jointName, increment);
                }

                return FunctionProvider.actionMode === ActionMode.PressAndHold
                    ? {
                          onClick: () => {
                              action();
                          },
                          onRelease: () => {
                              this.stopCurrentAction();
                          },
                          onLeave,
                      }
                    : {
                          onClick: () => {
                              if (this.activeVelocityAction) {
                                  this.stopCurrentAction();
                              } else {
                                  action();
                              }
                          },
                          onLeave,
                      };
        }
    }

    private resolveKeyControl(keyPress: string): KeyControls | undefined {
        if (!keyPress) return undefined;
        const entries = Object.entries(this.keyBindings) as [KeyControls, string][];
        for (const [control, boundKey] of entries) {
            if (boundKey === keyPress) return control;
        }
        return undefined;
    }
}

/**
 * Maps a `KeyControls` to its `ValidJoints` joint name.
 */
function getJointNameFromKeyFunction(keyControl: KeyControls): ValidJoints {
    switch (keyControl) {
        case "BASE_BACK":
        case "BASE_FORWARD":
            return "translate_mobile_base";
        case "BASE_LEFT":
        case "BASE_RIGHT":
            return "rotate_mobile_base";
        case "ARM_DOWN":
        case "ARM_UP":
            return "joint_lift";
        case "ARM_IN":
        case "ARM_OUT":
            return "wrist_extension";
        case "GRIPPER_CLOSE":
        case "GRIPPER_OPEN":
        case "GRIPPER_FORWARD":
        case "GRIPPER_BACK":
            return "joint_gripper_finger_left";
        case "HEAD_DOWN":
        case "HEAD_UP":
            return "joint_head_tilt";
        case "HEAD_LEFT":
        case "HEAD_RIGHT":
            return "joint_head_pan";
        default:
            throw Error("unknown keyboard function " + keyControl);
    }
}