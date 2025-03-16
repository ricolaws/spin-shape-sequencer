import React, { useState, useRef, useEffect } from "react";

interface StepCellProps {
  // Core props
  index: number; // Position in sequence (0-based)
  value: number; // Current value (MIDI note for pitch)
  x: number; // X position within parent
  width: number; // Width of the cell
  height: number; // Height of the entire cell container

  // State props
  isActive?: boolean; // Whether this step is active in the sequence
  inCurrentWindow?: boolean; // Whether this step is visible in the current window

  // Value range
  minValue?: number; // Minimum value (e.g., lowest MIDI note)
  maxValue?: number; // Maximum value (e.g., highest MIDI note)

  // Appearance
  activeStepColor?: string; // Color of the bar on an active step
  inactiveStepColor?: string; // Color of the bar on an inactive step
  cellBGColor?: string; // Background color of the cell

  // Callbacks
  onValueChange?: (index: number, newValue: number) => void; // Called when value changes
  onClick?: (index: number) => void; // For toggling active state
}

interface DragState {
  isDragging: boolean;
  startY: number;
  startValue: number;
  newValue?: number;
}

const StepCell: React.FC<StepCellProps> = ({
  index,
  value,
  x,
  width,
  height,
  isActive = false,
  inCurrentWindow = false,
  minValue = 48, // C3
  maxValue = 72, // C5
  activeStepColor = "#4080bf", // Blue
  inactiveStepColor = "#808080", // Gray
  cellBGColor = "#323232", // Dark gray
  onValueChange,
  onClick,
}) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startY: 0,
    startValue: value,
  });
  const cellRef = useRef<HTMLDivElement>(null);

  // Calculate the value's position in the cell (percentage from bottom)
  const valueRange = maxValue - minValue;
  const valuePercentage = ((value - minValue) / valueRange) * 100;
  const barHeight = `${valuePercentage}%`;

  // Determine the color based on active state
  const barColor = isActive ? activeStepColor : inactiveStepColor;

  // Create a transparent overlay when not in current window
  const opacity = inCurrentWindow ? 1 : 0.5;

  // Handle mouse down to start dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop the event from bubbling up to parent containers

    // If click handler exists and it's not already dragging, trigger it
    if (onClick && !dragState.isDragging) {
      onClick(index);
    }

    // Start dragging
    setDragState({
      isDragging: true,
      startY: e.clientY,
      startValue: value,
    });

    // Add window event listeners for drag
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    // Log to verify the event is being captured
    console.log(`StepCell ${index} mouse down, starting drag`);
  };

  // Handle mouse movement during drag
  const handleMouseMove = (e: MouseEvent) => {
    if (!dragState.isDragging) return;

    // Calculate the Y distance moved (negative because up = higher value)
    const deltaY = dragState.startY - e.clientY;

    // Update the value but don't trigger changes yet - just store it for mouseup
    const sensitivity = 3;
    const valueChange = Math.round(deltaY / sensitivity);
    dragState.newValue = Math.max(
      minValue,
      Math.min(maxValue, dragState.startValue + valueChange)
    );

    console.log(
      `Drag movement for step ${index}: delta=${deltaY}, calculating=${dragState.newValue}`
    );
  };

  // Handle mouse up to end dragging
  const handleMouseUp = () => {
    console.log(`StepCell ${index} mouse up, ending drag`);

    // Only trigger the change when mouse up occurs
    if (
      dragState.isDragging &&
      dragState.newValue !== undefined &&
      dragState.newValue !== value &&
      onValueChange
    ) {
      console.log(
        `Finalizing value change for step ${index}: ${value} -> ${dragState.newValue}`
      );
      onValueChange(index, dragState.newValue);
    }

    setDragState({
      ...dragState,
      isDragging: false,
      newValue: undefined,
    });

    // Remove window event listeners
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState.isDragging]);

  // Calculate MIDI note name to display
  const getNoteDisplay = () => {
    const noteNames = [
      "C",
      "C#",
      "D",
      "D#",
      "E",
      "F",
      "F#",
      "G",
      "G#",
      "A",
      "A#",
      "B",
    ];
    const octave = Math.floor(value / 12) - 1;
    const noteName = noteNames[value % 12];
    return `${noteName}${octave}`;
  };

  // Add hover state for better UX
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      ref={cellRef}
      className="absolute flex flex-col justify-end"
      style={{
        left: x,
        bottom: 0,
        width: width,
        height: height,
        backgroundColor: cellBGColor,
        borderRadius: "2px",
        opacity: opacity,
        transition: dragState.isDragging ? "none" : "opacity 0.2s",
        cursor: dragState.isDragging ? "ns-resize" : "pointer",
        border:
          dragState.isDragging || isHovered
            ? `2px solid ${barColor}`
            : "1px solid rgba(255,255,255,0.1)",
        boxShadow: dragState.isDragging
          ? "0 0 8px rgba(255,255,255,0.3)"
          : "none",
        zIndex: dragState.isDragging ? 10 : isHovered ? 5 : 1, // Bring to front when dragging or hovering
      }}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Drag handle (more obvious affordance for dragging) */}
      <div
        className="absolute w-full flex justify-center items-center pointer-events-none"
        style={{
          top: 5,
          opacity: isHovered || dragState.isDragging ? 1 : 0,
          transition: "opacity 0.2s",
        }}
      >
        <div className="w-8 h-1 bg-white rounded-full opacity-70"></div>
      </div>

      <div
        className="bar-value"
        style={{
          width: "100%",
          height: barHeight,
          backgroundColor: barColor,
          borderRadius: "2px 2px 0 0",
          transition: dragState.isDragging ? "none" : "height 0.1s",
        }}
      />

      {/* Note value label - always show when hovered or dragging */}
      <div
        className="absolute w-full text-center text-xs font-medium"
        style={{
          bottom: dragState.isDragging ? -20 : -15,
          color: "#fff",
          textShadow: "0px 0px 3px rgba(0,0,0,0.8)",
          opacity:
            inCurrentWindow && (isHovered || dragState.isDragging) ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: "none", // So it doesn't interfere with mouse events
        }}
      >
        {getNoteDisplay()}
      </div>
    </div>
  );
};

export default StepCell;
