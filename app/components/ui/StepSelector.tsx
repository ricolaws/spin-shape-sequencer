/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import StepCell from "./StepCell";
import { useSequencer } from "../../context/SequencerProvider";
import { logger } from "../utils/DebugLogger";

interface StepSelectorProps {
  className?: string;
  height?: number; // Height of the component (default: 200px)
  minValue?: number; // Minimum pitch value (default: 48 - C3)
  maxValue?: number; // Maximum pitch value (default: 72 - C5)
  activeStepColor?: string; // Color for active steps
  inactiveStepColor?: string; // Color for inactive steps
  cellBGColor?: string; // Background color of cells
  selectorColor?: string; // Color of the window border
}

interface WindowDragState {
  isDragging: boolean;
  startX: number;
  startOffset: number;
}

const StepSelector: React.FC<StepSelectorProps> = ({
  className = "",
  height = 200,
  minValue = 48, // C3
  maxValue = 72, // C5
  activeStepColor = "#4080bf", // Blue
  inactiveStepColor = "#808080", // Gray
  cellBGColor = "#323232", // Dark gray
  selectorColor = "#c1c1c1", // Light gray
}) => {
  const { state, setNoteWindowOffset, setNote } = useSequencer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0 });
  const [windowDrag, setWindowDrag] = useState<WindowDragState>({
    isDragging: false,
    startX: 0,
    startOffset: state.noteWindowOffset,
  });

  // Calculate dimensions when component mounts or resizes
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width });
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Calculate metrics for step cells and window
  const totalSteps = state.events.notes.length;
  const stepWidth = (dimensions.width * 0.75) / totalSteps;
  const spacing = (dimensions.width * 0.25) / (totalSteps + 1);

  // Calculate the starting index based on the window offset
  const maxOffset = totalSteps - state.numEvents;
  const startIndex = Math.round(state.noteWindowOffset * maxOffset);

  // Function to calculate window highlight width
  const calculateHighlightWidth = () => {
    // Width of all cells + spacing between + half spacing on ends + border
    return (
      state.numEvents * stepWidth +
      (state.numEvents - 1) * spacing +
      spacing +
      2
    );
  };

  // Window drag handlers
  const handleWindowMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent cell clicks
    setWindowDrag({
      isDragging: true,
      startX: e.clientX,
      startOffset: state.noteWindowOffset,
    });

    // Add window event listeners
    window.addEventListener("mousemove", handleWindowMouseMove);
    window.addEventListener("mouseup", handleWindowMouseUp);
  };

  const handleWindowMouseMove = (e: MouseEvent) => {
    if (!windowDrag.isDragging || !containerRef.current) return;

    const { width } = containerRef.current.getBoundingClientRect();
    const deltaX = e.clientX - windowDrag.startX;
    const offsetChange = deltaX / (width * 0.8); // Adjust sensitivity

    let newOffset = windowDrag.startOffset + offsetChange;
    // Clamp to valid range (0-1)
    newOffset = Math.max(0, Math.min(1, newOffset));

    setNoteWindowOffset(newOffset);
  };

  const handleWindowMouseUp = () => {
    setWindowDrag({
      ...windowDrag,
      isDragging: false,
    });

    // Remove window event listeners
    window.removeEventListener("mousemove", handleWindowMouseMove);
    window.removeEventListener("mouseup", handleWindowMouseUp);
  };

  // Clean up window drag event listeners
  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleWindowMouseMove);
      window.removeEventListener("mouseup", handleWindowMouseUp);
    };
  }, [windowDrag.isDragging]);

  // Restore window positioning via clicks in control bar
  const handleContainerClick = (e: React.MouseEvent) => {
    if (!containerRef.current || windowDrag.isDragging) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Calculate which step was clicked
    const clickedStep = Math.floor((x - spacing) / (stepWidth + spacing));

    // Ensure we don't go out of bounds
    if (clickedStep >= 0 && clickedStep < totalSteps) {
      // Calculate the new offset based on the clicked position
      if (maxOffset <= 0) {
        return; // Can't move if window size equals or exceeds total steps
      }

      let newStartIndex = clickedStep;
      // Center the window on the clicked step if possible
      newStartIndex = Math.max(
        0,
        Math.min(maxOffset, clickedStep - Math.floor(state.numEvents / 2))
      );

      const newOffset = newStartIndex / maxOffset;
      setNoteWindowOffset(newOffset);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[var(--background)] rounded-md overflow-hidden ${className}`}
      style={{ height: `${height}px` }}
      // Temporarily removed onClick handler to avoid interference with cell interactions
      // onClick={handleContainerClick}
    >
      {dimensions.width > 0 && (
        <>
          {/* Step cells */}
          <div className="absolute inset-0">
            {state.events.notes.map((note, index) => {
              // Calculate if this step is in the current window
              const inCurrentWindow =
                index >= startIndex && index < startIndex + state.numEvents;

              // Handler for pitch value changes - simplified
              const handlePitchChange = (index: number, newPitch: number) => {
                console.log(`Step ${index} pitch changed to ${newPitch}`);
                logger.log(
                  `Step ${index} pitch changing from ${note.pitch} to ${newPitch}`
                );

                // Use the setNote function from context
                setNote(index, {
                  ...note,
                  pitch: newPitch,
                });
              };

              return (
                <StepCell
                  key={index}
                  index={index}
                  value={note.pitch}
                  width={stepWidth}
                  height={height - 10} // Leave some margin
                  x={spacing + index * (stepWidth + spacing)}
                  isActive={state.events.active[index]}
                  inCurrentWindow={inCurrentWindow}
                  minValue={minValue}
                  maxValue={maxValue}
                  activeStepColor={activeStepColor}
                  inactiveStepColor={inactiveStepColor}
                  cellBGColor={cellBGColor}
                  onValueChange={handlePitchChange}
                  // No onClick handler as toggling is handled by EventMarker
                />
              );
            })}
          </div>

          {/* Highlight window for visible steps */}
          <div
            className="absolute border-4 rounded-sm pointer-events-none"
            style={{
              left:
                spacing -
                spacing / 2 +
                state.noteWindowOffset * maxOffset * (stepWidth + spacing),
              top: 0,
              width: calculateHighlightWidth(),
              height: height,
              borderColor: selectorColor,
              backgroundColor: "transparent",
              transition: "left 0.3s ease-out",
              zIndex: 5,
            }}
          />
        </>
      )}
    </div>
  );
};

export default StepSelector;
