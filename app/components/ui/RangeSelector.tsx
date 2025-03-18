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

  const [dragType, setDragType] = useState<"min" | "max" | "range" | null>(
    null
  );

  const dragStart = useRef({
    startX: 0,
    startMinValue: 0,
    startMaxValue: 0,
  });

  // Calculate local min and max from the sequencer state
  const totalSteps = state.events.notes.length;
  const maxOffset = totalSteps - state.numEvents;
  const startIndex = Math.round(state.noteWindowOffset * maxOffset);
  const endIndex = startIndex + state.numEvents - 1;

  // Local state for min and max values
  const [minValue, setMinValue] = useState(startIndex);
  const [maxValue, setMaxValue] = useState(endIndex);

  // Calculate range size (inclusive of both min and max)
  const getRangeSize = (min: number, max: number): number => {
    return max - min + 1;
  };

  // Calculate minimum gap between handles to enforce minRangeSize
  const getMinHandleGap = (size: number): number => {
    return size - 1;
  };

  // Force recalculation of handles and positions when drag ends
  const enforceConstraints = () => {
    // Get minimum gap between handles for constraint checks
    const minGap = getMinHandleGap(minRangeSize);

    if (maxValue < minValue + minGap) {
      setMaxValue(minValue + minGap);
    }

    if (minValue > maxPossibleValue - minGap) {
      setMinValue(maxPossibleValue - minGap);
      setMaxValue(maxPossibleValue);
    }

    // Ensure max doesn't go below the minimum possible value plus gap
    if (maxValue < minPossibleValue + minGap) {
      setMaxValue(minPossibleValue + minGap);
      setMinValue(minPossibleValue);
    }
  };

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
    if (dragType === null) {
      // Only update when not dragging to prevent jumps
      const newStartIndex = Math.round(state.noteWindowOffset * maxOffset);
      const newEndIndex = newStartIndex + state.numEvents - 1;

      setMinValue(newStartIndex);
      setMaxValue(newEndIndex);
    }
  }, [state.noteWindowOffset, state.numEvents, maxOffset, dragType]);

  // Calculate pixel positions for handles to align with StepCells
  const getPositionFromValue = (value: number): number => {
    // Validate inputs to prevent NaN
    if (dimensions.width <= 0) return 12; // Default to minimum position

    // Ensure value is within bounds
    const safeValue = Math.max(
      minPossibleValue,
      Math.min(maxPossibleValue, value)
    );

    // Match the spacing calculation used in StepSelector for alignment
    const totalSteps = maxPossibleValue - minPossibleValue + 1;
    const stepWidth = (dimensions.width * 0.75) / totalSteps;
    const spacing = (dimensions.width * 0.25) / (totalSteps + 1);

    // Calculate position to align with StepCells by using the same formula
    return spacing + (safeValue - minPossibleValue) * (stepWidth + spacing);
  };

  // Pointer event handlers
  const handlePointerDown = (
    e: React.PointerEvent,
    type: "min" | "max" | "range"
  ) => {
    e.preventDefault();
    setDragType(type);

    // Capture the pointer
    if (containerRef.current) {
      containerRef.current.setPointerCapture(e.pointerId);
    }

    // Store starting values for the drag operation
    dragStart.current = {
      startX: e.clientX,
      startMinValue: minValue,
      startMaxValue: maxValue,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragType || !containerRef.current) return;

    // Calculate pixel distance moved
    const deltaX = e.clientX - dragStart.current.startX;

    // Match the spacing calculation used in StepSelector for alignment
    const totalSteps = maxPossibleValue - minPossibleValue + 1;
    const stepWidth = (dimensions.width * 0.75) / totalSteps;
    const spacing = (dimensions.width * 0.25) / (totalSteps + 1);

    // Calculate value change based on pixel movement
    // Use the same scale as the StepCells
    const pixelsPerStep = stepWidth + spacing;
    const deltaValue = Math.round(deltaX / pixelsPerStep);

    // Get minimum gap between handles for constraint checks
    const minGap = getMinHandleGap(minRangeSize);

    if (dragType === "min") {
      // Calculate new value based on direct pixel movement
      const newMinValue = dragStart.current.startMinValue + deltaValue;

      // Apply constraints - ensure minRangeSize is strictly enforced
      const constrainedValue = Math.max(
        minPossibleValue,
        Math.min(newMinValue, dragStart.current.startMaxValue - minGap)
      );

      // Only update min value, don't affect max value
      setMinValue(constrainedValue);
    } else if (dragType === "max") {
      // Calculate new value based on direct pixel movement
      const newMaxValue = dragStart.current.startMaxValue + deltaValue;

      // Apply constraints - ensure minRangeSize is strictly enforced
      const constrainedValue = Math.min(
        maxPossibleValue,
        Math.max(newMaxValue, dragStart.current.startMinValue + minGap)
      );

      // Only update max value, don't affect min value
      setMaxValue(constrainedValue);
    } else if (dragType === "range") {
      // Calculate original range size - keep it fixed during drag
      const rangeSize =
        dragStart.current.startMaxValue - dragStart.current.startMinValue;

      // Calculate new values based on direct pixel movement
      let newMinValue = dragStart.current.startMinValue + deltaValue;
      let newMaxValue = dragStart.current.startMaxValue + deltaValue;

      // Ensure values stay within bounds
      if (newMinValue < minPossibleValue) {
        newMinValue = minPossibleValue;
        newMaxValue = minPossibleValue + rangeSize;
      }

      if (newMaxValue > maxPossibleValue) {
        newMaxValue = maxPossibleValue;
        newMinValue = maxPossibleValue - rangeSize;
      }

      // Update both values together
      setMinValue(newMinValue);
      setMaxValue(newMaxValue);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragType || !containerRef.current) return;

    // Release the pointer
    containerRef.current.releasePointerCapture(e.pointerId);

    // Ensure constraints are enforced
    enforceConstraints();

    // Calculate and apply changes to the sequencer state
    const rangeSize = getRangeSize(minValue, maxValue);

    // Protect against division by zero or negative maxOffset
    let newOffset = 0;
    if (maxOffset > 0) {
      newOffset = Math.max(0, Math.min(1, minValue / maxOffset));
    }

    console.log({
      minValue,
      maxValue,
      rangeValue: rangeSize,
    });

    // Apply state changes - check that range meets minimum size
    if (rangeSize >= minRangeSize) {
      setNumEvents(rangeSize);
      setNoteWindowOffset(newOffset);
    }

    // Reset drag state
    setDragType(null);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{
        height: `${height}px`,
        touchAction: "none",
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
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

          {/* Selected range - now draggable */}
          <div
            className="absolute rounded-md cursor-move"
            style={{
              left: `${getPositionFromValue(minValue)}px`,
              width: `${Math.max(
                0,
                getPositionFromValue(maxValue) - getPositionFromValue(minValue)
              )}px`,
              top: "50%",
              height: "12px",
              transform: "translateY(-50%)",
              backgroundColor: rangeColor,
              opacity: 0.8,
              zIndex: dragType === "range" ? 2 : 1,
            }}
            onPointerDown={(e) => handlePointerDown(e, "range")}
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
              zIndex: dragType === "min" ? 3 : 2,
            }}
            onPointerDown={(e) => handlePointerDown(e, "min")}
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
              zIndex: dragType === "max" ? 3 : 2,
            }}
            onPointerDown={(e) => handlePointerDown(e, "max")}
          />
        </>
      )}
    </div>
  );
};

export default RangeSelector;
