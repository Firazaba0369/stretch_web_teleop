import {
    JOINT_VELOCITIES,
    JOINT_INCREMENTS,
    ValidJoints,
    ValidJointStateDict,
} from "shared/util";
import { ActionMode } from "../utils/component_definitions";
import { FunctionProvider } from "./FunctionProvider";

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

/** State for a single button on a button pad. */
export enum KeyState {
    Inactive = "inactive",
    Active = "active",
    Collision = "collision",
    Limit = "limit",
}
export type KeyboardStateMap = Map<KeyControls, KeyState>;
export type KeyBindings = Partial<Record<KeyControls, string>>;

/** Array of the pan tilt keys */
export const panTiltkeys: KeyControls[] = [
    "HEAD_UP",
    "HEAD_DOWN",
    "HEAD_LEFT",
    "HEAD_RIGHT",
];

/** key functions which require moving a joint in the negative direction. */
const negativekeyPadFunctions = new Set<KeyControls>([
    "BASE_BACK",
    "BASE_RIGHT",
    "ARM_DOWN",
    "ARM_IN",
    "GRIPPER_CLOSE",
    "WRIST_ROTATE_OUT",
    "WRIST_DOWN",
    "WRIST_LEFT",
    "CAMERA_TILT_DOWN",
    "CAMERA_PAN_RIGHT",
]);

/**
 * Uses the key value and key key bindings to get corresponding joint name.
 *
 * @param keyValue the type of key in a key pad
 * @param KeyBindings the keys binded to control
 * @returns the name of the corresponding joint
 */
function getJointNameFromkeyFunction(
    keyPress: KeyValue, bindings: KeyBindings
): ValidJoints {
    switch (keyPress) {
        case keypress == bindings.BASE_BACK:
        case keypress == bindings.BASE_FORWARD:
            return "translate_mobile_base";

        case keypress == bindings.BASE_LEFT:
        case keypress == bindings.BASE_RIGHT:
            return "rotate_mobile_base";

        case keypress == bindings.ARM_DOWN:
        case keypress == bindings.ARM_UP:
            return "joint_lift";

        case keypress == bindings.ARM_IN:
        case keypress == bindings.ARM_OUT:
            return "wrist_extension";

        case keypress == bindings.GRIPPER_CLOSE:
        case keypress == bindings.GRIPPER_OPEN:
            return "joint_gripper_finger_left";

        case keypress == bindings.WRIST_LEFT:
        case keypress == bindings.WRIST_RIGHT:
            return "joint_wrist_roll";

        case keypress == bindings.WRIST_UP:
        case keypress == bindings.WRIST_DOWN:
            return "joint_wrist_pitch";

        case keypress == bindings.WRIST_ROTATE_IN:
        case keypress == bindings.WRIST_ROTATE_OUT:
            return "joint_wrist_yaw";

        case keypress == bindings.CAMERA_TILT_UP:
        case keypress == bindings.CAMERA_TILT_DOWN:
            return "joint_head_tilt";

        case keypress == bindings.CAMERA_PAN_LEFT:
        case keypress == bindings.CAMERA_PAN_RIGHT:
            return "joint_head_pan";

        default:
            throw Error("unknown key pad function" + keyPress);
    }
}
