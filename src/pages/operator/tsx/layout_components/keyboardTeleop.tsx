import React, { useEffect, useMemo, useState } from "react";
import {
    CustomizableComponentProps,
} from "./CustomizableComponent";
import "operator/css/KeyboardTeleop.css";

// IDs for all teleop controls for mapping bindings
type TeleopControlId =
    | "SLOW"
    | "MEDIUM"
    | "FAST"
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

// Structure defining each control, its label, optional hint, and grouping for display
type TeleopControl = {
    id: TeleopControlId;
    label: string;
    hint?: string;
    group: "STEP" | "BASE" | "ARM" | "GRIPPER" | "HEAD" | "QUIT";
};

// List of all controls with their respective IDs, labels, hints, and groups
const TELEOP_CONTROLS: TeleopControl[] = [
    { id: "SLOW", label: "Slow", hint: "Step Size", group: "STEP" },
    { id: "MEDIUM", label: "Medium", hint: "Step Size", group: "STEP" },
    { id: "FAST", label: "Fast", hint: "Step Size", group: "STEP" },

    { id: "BASE_FORWARD", label: "Forward", hint: "Base", group: "BASE" },
    { id: "BASE_LEFT", label: "Left", hint: "Base", group: "BASE" },
    { id: "BASE_BACK", label: "Back", hint: "Base", group: "BASE" },
    { id: "BASE_RIGHT", label: "Right", hint: "Base", group: "BASE" },

    { id: "ARM_UP", label: "Up", hint: "Arm", group: "ARM" },
    { id: "ARM_IN", label: "In", hint: "Arm", group: "ARM" },
    { id: "ARM_DOWN", label: "Down", hint: "Arm", group: "ARM" },
    { id: "ARM_OUT", label: "Out", hint: "Arm", group: "ARM" },

    { id: "GRIPPER_FORWARD", label: "Forward", hint: "Gripper", group: "GRIPPER" },
    { id: "GRIPPER_CLOSE", label: "Close", hint: "Gripper", group: "GRIPPER" },
    { id: "GRIPPER_BACK", label: "Back", hint: "Gripper", group: "GRIPPER" },
    { id: "GRIPPER_OPEN", label: "Open", hint: "Gripper", group: "GRIPPER" },

    { id: "HEAD_UP", label: "Up", hint: "Head", group: "HEAD" },
    { id: "HEAD_LEFT", label: "Left", hint: "Head", group: "HEAD" },
    { id: "HEAD_DOWN", label: "Down", hint: "Head", group: "HEAD" },
    { id: "HEAD_RIGHT", label: "Right", hint: "Head", group: "HEAD" },

    { id: "QUIT", label: "Quit", group: "QUIT" },
];

type BindingMap = Partial<Record<TeleopControlId, string>>;

// Helper function to format key values for display
function formatKey(event: KeyboardEvent): string {
    const key = event.key;

    if (key === " ") return "Space";
    if (key === "ArrowUp") return "↑";
    if (key === "ArrowDown") return "↓";
    if (key === "ArrowLeft") return "←";
    if (key === "ArrowRight") return "→";
    if (key === "Escape") return "Esc";

    if (key.length === 1) return key.toUpperCase();

    return key;
}

// Function to determine if a key is reserved and should not be used for bindings
function isReservedKey(event: KeyboardEvent): boolean {
    return event.key === "Tab";
}

// Key tile component 
type KeyTileProps = {
    value?: string;
    blinking?: boolean;
};

// Component for rendering a single key tile
const KeyTile = ({ value, blinking = false }: KeyTileProps) => {
    return (
        <div className={`keyboard-teleop-key ${blinking ? "binding" : ""}`}>
            {value ?? ""}
        </div>
    );
};

// Component for rendering a control item 
type ControlItemProps = {
    control: TeleopControl;
    value?: string;
    active?: boolean;
};

// Component for rendering a single control item with its label and associated key tile
const ControlItem = ({ control, value, active = false }: ControlItemProps) => {
    return (
        <div className="keyboard-teleop-control-item">
            <div className="keyboard-teleop-control-label">{control.label}</div>
            <KeyTile value={value} blinking={active && !value} />
        </div>
    );
};

// Main component for keyboard teleoperation binding interface
export const KeyboardTeleop = (props: CustomizableComponentProps) => {
    if (!props.definition.type) {
        throw new Error(`Component at ${props.path} is missing type`);
    }

    const [bindings, setBindings] = useState<BindingMap>({});
    const [bindingIndex, setBindingIndex] = useState(0);

    const activeControl = TELEOP_CONTROLS[bindingIndex];
    const bindingComplete = bindingIndex >= TELEOP_CONTROLS.length;

    useEffect(() => {
        // Handler for keydown events to capture user input for bindings
        const onKeyDown = (event: KeyboardEvent) => {
            if (bindingComplete) return;
            if (isReservedKey(event)) return;

            event.preventDefault();

            const active = TELEOP_CONTROLS[bindingIndex];
            if (!active) return;

            const formattedKey = formatKey(event);

            setBindings((prev) => ({
                ...prev,
                [active.id]: formattedKey,
            }));

            setBindingIndex((prev) => prev + 1);
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [bindingIndex, bindingComplete]);

    // Group controls by their defined groups for organized rendering
    const grouped = useMemo(() => {
        return {
            STEP: TELEOP_CONTROLS.filter((c) => c.group === "STEP"),
            BASE: TELEOP_CONTROLS.filter((c) => c.group === "BASE"),
            ARM: TELEOP_CONTROLS.filter((c) => c.group === "ARM"),
            GRIPPER: TELEOP_CONTROLS.filter((c) => c.group === "GRIPPER"),
            HEAD: TELEOP_CONTROLS.filter((c) => c.group === "HEAD"),
            QUIT: TELEOP_CONTROLS.filter((c) => c.group === "QUIT"),
        };
    }, []);

    // Render the keyboard teleoperation binding interface with sections for each control group
    return (
        <div className="keyboard-teleop">
            <div className="keyboard-teleop-row-block keyboard-teleop-top-row">
                <div className="keyboard-teleop-binding">
                    {bindingComplete ? (
                        <h3>Bindings Complete</h3>
                    ) : (
                        <h3>
                            Binding:
                            <span className="keyboard-teleop-current-binding">
                                {activeControl?.hint ? ` ${activeControl.hint}: ` : " "}
                                {activeControl?.label}
                            </span>
                        </h3>
                    )}
                </div>

                <div className="keyboard-teleop-section keyboard-teleop-step">
                    <div className="keyboard-teleop-section-title">Step Size</div>
                    <div className="keyboard-teleop-row">
                        {grouped.STEP.map((control) => (
                            <ControlItem
                                key={control.id}
                                control={control}
                                value={bindings[control.id]}
                                active={activeControl?.id === control.id}
                            />
                        ))}
                    </div>
                </div>

                <div className="keyboard-teleop-section keyboard-teleop-quit">
                    <div className="keyboard-teleop-section-title">Quit</div>
                    <div className="keyboard-teleop-row">
                        {grouped.QUIT.map((control) => (
                            <ControlItem
                                key={control.id}
                                control={control}
                                value={bindings[control.id]}
                                active={activeControl?.id === control.id}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="keyboard-teleop-lower">
                <div className="keyboard-teleop-side keyboard-teleop-side-left">
                    <div className="keyboard-teleop-section">
                        <div className="keyboard-teleop-section-title">Base</div>
                        <div className="keyboard-teleop-row">
                            {grouped.BASE.map((control) => (
                                <ControlItem
                                    key={control.id}
                                    control={control}
                                    value={bindings[control.id]}
                                    active={activeControl?.id === control.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="keyboard-teleop-section">
                        <div className="keyboard-teleop-section-title">Gripper</div>
                        <div className="keyboard-teleop-row">
                            {grouped.GRIPPER.map((control) => (
                                <ControlItem
                                    key={control.id}
                                    control={control}
                                    value={bindings[control.id]}
                                    active={activeControl?.id === control.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div className="keyboard-teleop-side keyboard-teleop-side-right">
                    <div className="keyboard-teleop-section">
                        <div className="keyboard-teleop-section-title">Arm</div>
                        <div className="keyboard-teleop-row">
                            {grouped.ARM.map((control) => (
                                <ControlItem
                                    key={control.id}
                                    control={control}
                                    value={bindings[control.id]}
                                    active={activeControl?.id === control.id}
                                />
                            ))}
                        </div>
                    </div>

                    <div className="keyboard-teleop-section">
                        <div className="keyboard-teleop-section-title">Head</div>
                        <div className="keyboard-teleop-row">
                            {grouped.HEAD.map((control) => (
                                <ControlItem
                                    key={control.id}
                                    control={control}
                                    value={bindings[control.id]}
                                    active={activeControl?.id === control.id}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};