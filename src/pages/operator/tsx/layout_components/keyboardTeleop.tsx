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

// Helper function to format key values for display in the key tiles, with special handling for certain keys
function formatKeyDisplay(value?: string): string {
    if (!value) return "";

    switch (value) {
        case "Backspace":
            return "Bksp";
        case "Space":
            return "Space"; // already short enough
        case "Control":
            return "Ctrl";
        case "Escape":
            return "Esc";
        case "Delete":
            return "Del";
        case "Enter":
            return "⏎";
        default:
            return value.length > 5 ? value.slice(0, 5) : value;
    }
}

// Function to determine if a key is reserved and should not be used for bindings
function isReservedKey(event: KeyboardEvent): boolean {
    return event.key === "Tab";
}

// Key tile component 
type KeyTileProps = {
    value?: string;
    blinking?: boolean;
    pressed?: boolean;
};

// Component for rendering a single key tile
const KeyTile = ({ value, blinking = false, pressed = false }: KeyTileProps) => {
    return (
        <div
            className={`keyboard-teleop-key ${blinking ? "binding" : ""} ${pressed ? "pressed" : ""}`}
            title={value ?? ""}
        >
            {formatKeyDisplay(value)}
        </div>
    );
};

// Component for rendering a control item 
type ControlItemProps = {
    control: TeleopControl;
    value?: string;
    active?: boolean;
    pressed?: boolean;
};

// Component for rendering a single control item with its label and associated key tile
const ControlItem = ({ control, value, active = false, pressed = false }: ControlItemProps) => {
    return (
        <div className="keyboard-teleop-control-item">
            <div className="keyboard-teleop-control-label">{control.label}</div>
            <KeyTile value={value} blinking={active && !value} pressed={pressed} />
        </div>
    );
};

// Component for rendering a group of controls in a diamond layout
type DiamondGroupProps = {
    title: string;
    controls: TeleopControl[];
    bindings: BindingMap;
    activeControlId?: TeleopControlId;
    pressedKeys: Set<string>;
};

// Diamond group used for Base, Arm, Gripper, and Head sections
const DiamondGroup = ({
    title,
    controls,
    bindings,
    activeControlId,
    pressedKeys,
}: DiamondGroupProps) => {
    
    // Map controls to their respective positions in the diamond layout based on their labels
    const top = controls.find((c) => c.label === "Forward" || c.label === "Up");
    const left = controls.find((c) => c.label === "Left" || c.label === "In" || c.label === "Close");
    const right = controls.find((c) => c.label === "Right" || c.label === "Out" || c.label === "Open");
    const bottom = controls.find((c) => c.label === "Back" || c.label === "Down");

    return (
        <div className="keyboard-teleop-section">
            <div className="keyboard-teleop-section-title">{title}</div>

            <div className="keyboard-teleop-diamond">
                <div className="diamond-top">
                    {top && (
                        <ControlItem
                            control={top}
                            value={bindings[top.id]}
                            active={activeControlId === top.id}
                            pressed={!!bindings[top.id] && pressedKeys.has(bindings[top.id] as string)}
                        />
                    )}
                </div>

                <div className="diamond-left">
                    {left && (
                        <ControlItem
                            control={left}
                            value={bindings[left.id]}
                            active={activeControlId === left.id}
                            pressed={!!bindings[left.id] && pressedKeys.has(bindings[left.id] as string)}
                        />
                    )}
                </div>

                <div className="diamond-right">
                    {right && (
                        <ControlItem
                            control={right}
                            value={bindings[right.id]}
                            active={activeControlId === right.id}
                            pressed={!!bindings[right.id] && pressedKeys.has(bindings[right.id] as string)}
                        />
                    )}
                </div>

                <div className="diamond-bottom">
                    {bottom && (
                        <ControlItem
                            control={bottom}
                            value={bindings[bottom.id]}
                            active={activeControlId === bottom.id}
                            pressed={!!bindings[bottom.id] && pressedKeys.has(bindings[bottom.id] as string)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};


// Main component for keyboard teleoperation binding interface
export const KeyboardTeleop = (props: CustomizableComponentProps) => {
    if (!props.definition.type) {
        throw new Error(`Component at ${props.path} is missing type`);
    }

    // Track pressed keys for blink effect
    const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

    // State to track current bindings and which control is currently being bound
    const [bindings, setBindings] = useState<BindingMap>({});
    const [bindingIndex, setBindingIndex] = useState<number | null>(null);


    const isBinding = bindingIndex !== null && bindingIndex < TELEOP_CONTROLS.length;
    const bindingComplete = bindingIndex !== null && bindingIndex >= TELEOP_CONTROLS.length;
    const activeControl =
        bindingIndex !== null && bindingIndex < TELEOP_CONTROLS.length
            ? TELEOP_CONTROLS[bindingIndex]
            : undefined;

    // Function to start the binding process by resetting state 
    const startBinding = () => {
        setBindings({});
        setBindingIndex(0);
        setPressedKeys(new Set());
    };

    // Effect to handle keydown events for binding controls when in binding mode
    useEffect(() => {
        if (!isBinding) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (isReservedKey(event)) return;

            event.preventDefault();

            const active = activeControl;
            if (!active) return;

            const formattedKey = formatKey(event);

            const keyAlreadyUsed = Object.entries(bindings).some(
                ([controlId, boundKey]) =>
                    controlId !== active.id && boundKey === formattedKey
            );

            if (keyAlreadyUsed) {
                return;
            }

            setBindings((prev) => ({
                ...prev,
                [active.id]: formattedKey,
            }));

            setBindingIndex((prev) => {
                if (prev === null) return prev;
                return prev + 1;
            });
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [isBinding, activeControl, bindings]);

    // Effect to track currently pressed keys for visual feedback on key tiles
    useEffect(() => {
        if (isBinding) return;

        const onKeyDown = (event: KeyboardEvent) => {
            const formattedKey = formatKey(event);

            setPressedKeys((prev) => {
                if (prev.has(formattedKey)) return prev;
                const next = new Set(prev);
                next.add(formattedKey);
                return next;
            });
        };

        const onKeyUp = (event: KeyboardEvent) => {
            const formattedKey = formatKey(event);

            setPressedKeys((prev) => {
                if (!prev.has(formattedKey)) return prev;
                const next = new Set(prev);
                next.delete(formattedKey);
                return next;
            });
        };

        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);

        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, [isBinding]);

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

    // Determine the label for the bind button based on the current binding state
    const bindButtonLabel = isBinding
        ? `Binding ${activeControl?.hint ? `${activeControl.hint}: ` : ""}${activeControl?.label ?? ""} key...`
        : bindingComplete
            ? "Rebind Keys"
            : "Bind Keys";

    // Render the keyboard teleoperation binding interface with sections for each control group
    return (
        <div className="keyboard-teleop">
            <div className="keyboard-teleop-row-block keyboard-teleop-top-row">
                <div className="keyboard-teleop-binding">
                    <button
                        type="button"
                        className={`keyboard-teleop-bind-button ${isBinding ? "is-binding" : ""}`}
                        onClick={startBinding}
                        disabled={isBinding}
                    >
                        {bindButtonLabel}
                    </button>
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
                                pressed={!!bindings[control.id] && pressedKeys.has(bindings[control.id] as string)}
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
                                pressed={!!bindings[control.id] && pressedKeys.has(bindings[control.id] as string)}
                            />
                        ))}
                    </div>
                </div>
            </div>
            
            <div className="keyboard-teleop-lower">
                <DiamondGroup
                    title="Base"
                    controls={grouped.BASE}
                    bindings={bindings}
                    activeControlId={activeControl?.id}
                    pressedKeys={pressedKeys}
                />
                <DiamondGroup
                    title="Gripper"
                    controls={grouped.GRIPPER}
                    bindings={bindings}
                    activeControlId={activeControl?.id}
                    pressedKeys={pressedKeys}
                />
                <DiamondGroup
                    title="Arm"
                    controls={grouped.ARM}
                    bindings={bindings}
                    activeControlId={activeControl?.id}
                    pressedKeys={pressedKeys}
                />

                <DiamondGroup
                    title="Head"
                    controls={grouped.HEAD}
                    bindings={bindings}
                    activeControlId={activeControl?.id}
                    pressedKeys={pressedKeys}
                />
            </div>
        </div>
    );
};