import React, { useState, useRef, useEffect } from "react";
import { useSequencer } from "../../context/SequencerProvider";

interface RangeSelectorProps {
  className?: string;
  minPossibleValue?: number;
  maxPossibleValue?: number;
  minRangeSize?: number;
  handleColor?: string;
  trackColor?: string;
  rangeColor?: string;
  height?: number;
}

const RangeSelector: React.FC<RangeSelectorProps> = ({
  className = "",
  minPossibleValue = 0,
  maxPossibleValue = 16,
  minRangeSize = 3,
  handleColor = "#ffffff",
  trackColor = "#404040",
  rangeColor = "#4080bf",
  height = 30,
}) => {
  const { state, setNumEvents, setNoteWindowOffset } = useSequencer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0 });

  // Track which handle is being dragged (if any)
  const [draggingHandle, setDraggingHandle] = useState<"min" | "max" | null>(
    null
  );

  // Calculate local min and max from the sequencer state
  const totalSteps = state.events.notes.length;
  const maxOffset = totalSteps - state.numEvents;
  const startIndex = Math.round(state.noteWindowOffset * maxOffset);
  const endIndex = startIndex + state.numEvents - 1;

  // Local state for min and max values
  const [minValue, setMinValue] = useState(startIndex);
  const [maxValue, setMaxValue] = useState(endIndex);

  // Update dimensions on mount and resize
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

  // Update local state when sequencer state changes
  useEffect(() => {
    const newStartIndex = Math.round(state.noteWindowOffset * maxOffset);
    const newEndIndex = newStartIndex + state.numEvents - 1;

    setMinValue(newStartIndex);
    setMaxValue(newEndIndex);
  }, [state.noteWindowOffset, state.numEvents, maxOffset]);

  // Calculate pixel positions for handles
  const getPositionFromValue = (value: number): number => {
    const range = maxPossibleValue - minPossibleValue;
    const percentage = (value - minPossibleValue) / range;
    return percentage * (dimensions.width - 24) + 12; // 12px is half the handle width
  };

  // Calculate value from pixel position
  const getValueFromPosition = (position: number): number => {
    const range = maxPossibleValue - minPossibleValue;
    // Adjust for handle size
    const adjustedPosition = Math.max(
      12,
      Math.min(position, dimensions.width - 12)
    );
    const percentage = (adjustedPosition - 12) / (dimensions.width - 24);

    // Convert to nearest integer value
    return Math.round(minPossibleValue + percentage * range);
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent, handle: "min" | "max") => {
    e.preventDefault();
    setDraggingHandle(handle);

    // Add document-level event listeners
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!draggingHandle || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const position = e.clientX - rect.left;
    const newValue = getValueFromPosition(position);

    if (draggingHandle === "min") {
      // Ensure min doesn't go beyond max - minRangeSize
      const limitedValue = Math.min(newValue, maxValue - minRangeSize);
      setMinValue(limitedValue);
    } else {
      // Ensure max doesn't go below min + minRangeSize
      const limitedValue = Math.max(newValue, minValue + minRangeSize);
      setMaxValue(limitedValue);
    }
  };

  const handleMouseUp = () => {
    if (!draggingHandle) return;

    // Calculate and apply changes to the sequencer state
    const rangeSize = maxValue - minValue + 1;
    const newOffset = minValue / maxOffset;

    console.log({
      minValue,
      maxValue,
      rangeValue: rangeSize,
    });

    setNumEvents(rangeSize);
    setNoteWindowOffset(newOffset);

    // Clean up event listeners
    setDraggingHandle(null);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{
        height: `${height}px`,
        touchAction: "none",
      }}
    >
      {dimensions.width > 0 && (
        <>
          {/* Track background */}
          <div
            className="absolute rounded-full"
            style={{
              left: "12px",
              right: "12px",
              top: "50%",
              height: "4px",
              transform: "translateY(-50%)",
              backgroundColor: trackColor,
            }}
          />

          {/* Selected range */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${getPositionFromValue(minValue)}px`,
              width: `${
                getPositionFromValue(maxValue) - getPositionFromValue(minValue)
              }px`,
              top: "50%",
              height: "4px",
              transform: "translateY(-50%)",
              backgroundColor: rangeColor,
            }}
          />

          {/* Min handle */}
          <div
            className="absolute rounded-full cursor-ew-resize"
            style={{
              left: `${getPositionFromValue(minValue)}px`,
              top: "50%",
              width: "24px",
              height: "24px",
              transform: "translate(-50%, -50%)",
              backgroundColor: handleColor,
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              zIndex: draggingHandle === "min" ? 2 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, "min")}
          />

          {/* Max handle */}
          <div
            className="absolute rounded-full cursor-ew-resize"
            style={{
              left: `${getPositionFromValue(maxValue)}px`,
              top: "50%",
              width: "24px",
              height: "24px",
              transform: "translate(-50%, -50%)",
              backgroundColor: handleColor,
              border: "2px solid white",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              zIndex: draggingHandle === "max" ? 2 : 1,
            }}
            onMouseDown={(e) => handleMouseDown(e, "max")}
          />

          {/* Value labels */}
          <div
            className="absolute text-xs text-white"
            style={{
              left: `${getPositionFromValue(minValue)}px`,
              bottom: "100%",
              transform: "translateX(-50%)",
              marginBottom: "4px",
            }}
          >
            {minValue}
          </div>

          <div
            className="absolute text-xs text-white"
            style={{
              left: `${getPositionFromValue(maxValue)}px`,
              bottom: "100%",
              transform: "translateX(-50%)",
              marginBottom: "4px",
            }}
          >
            {maxValue}
          </div>
        </>
      )}
    </div>
  );
};

export default RangeSelector;
