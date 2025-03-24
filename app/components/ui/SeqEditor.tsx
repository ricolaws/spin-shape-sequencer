import React, { useEffect, useRef, useState } from "react";
import StepCell from "./StepCell";
import { useSequencer } from "../../context/SequencerProvider";
import { logger } from "../../utils/DebugLogger";
import SeqRangeControl from "./SeqRangeControl";
import { colors } from "@/app/styles/colors";
import { Target } from "../../audio/types";

interface SeqEditorProps {
  className?: string;
  height?: number;
  minValue?: number;
  maxValue?: number;
  activeStepColor?: string;
  inactiveStepColor?: string;
  cellBGColor?: string;
  selectorAColor?: string; // Color for the first polygon selector
  selectorBColor?: string; // Color for the second polygon selector
}

const SeqEditor: React.FC<SeqEditorProps> = ({
  className = "",
  height = 200,
  minValue = 48,
  maxValue = 72,
  activeStepColor = colors.primary,
  inactiveStepColor = "#808080",
  cellBGColor = "#323232",
  selectorAColor = colors.primary,
  selectorBColor = colors.secondary,
}) => {
  const { state, setNote } = useSequencer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0 });

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

  const totalNotes = state.events.notes.length;
  const stepWidth = (dimensions.width * 0.75) / totalNotes;
  const spacing = (dimensions.width * 0.25) / (totalNotes + 1);

  // Get polygon-specific state for A and B
  const polygonA = state.polygons.A;
  const polygonB = state.polygons.B;

  // Function to calculate window highlight width for a specific target
  const calculateHighlightWidth = (target: Target) => {
    const numEvents = state.polygons[target].numEvents;
    return numEvents * stepWidth + (numEvents - 1) * spacing + spacing + 2;
  };

  // Function to determine if a step is active
  const isStepActive = (index: number) => {
    return polygonA.activeEvents[index] || polygonB.activeEvents[index];
  };

  // Function to determine if a step is in a polygon's window
  const isInWindow = (index: number, target: Target) => {
    const { startIndex, numEvents } = state.polygons[target];
    return index >= startIndex && index < startIndex + numEvents;
  };

  // Handler for pitch value changes
  const handlePitchChange = (index: number, newPitch: number) => {
    const note = state.events.notes[index];
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
    <div className="w-full mb-4">
      <div className="mb-2">
        <SeqRangeControl
          target="A"
          minPossibleValue={0}
          maxPossibleValue={totalNotes - 1}
          minRangeSize={3}
          handleColor={selectorAColor}
          trackColor={cellBGColor}
          rangeColor={selectorAColor}
          height={40}
          className="mb-2"
        />
      </div>

      <div className="mb-2">
        <SeqRangeControl
          target="B"
          minPossibleValue={0}
          maxPossibleValue={totalNotes - 1}
          minRangeSize={3}
          handleColor={selectorBColor}
          trackColor={cellBGColor}
          rangeColor={selectorBColor}
          height={40}
          className="mb-4"
        />
      </div>

      <div
        ref={containerRef}
        className={`relative w-full bg-[var(--background)] rounded-md overflow-hidden ${className}`}
        style={{ height: `${height}px` }}
      >
        <>
          {/* Step cells */}
          <div className="absolute inset-0">
            {state.events.notes.map((note, index) => {
              // Calculate if this step is in either current window
              const inWindowA = isInWindow(index, "A");
              const inWindowB = isInWindow(index, "B");

              // Consider a step "in current window" if it's in either window
              const inCurrentWindow = inWindowA || inWindowB;

              return (
                <StepCell
                  key={index}
                  index={index}
                  value={note.pitch}
                  width={stepWidth}
                  height={height - 8} // Leave some margin
                  x={spacing + index * (stepWidth + spacing)}
                  isActive={isStepActive(index)}
                  inCurrentWindow={inCurrentWindow}
                  minValue={minValue}
                  maxValue={maxValue}
                  activeStepColor={activeStepColor}
                  inactiveStepColor={inactiveStepColor}
                  cellBGColor={cellBGColor}
                  onValueChange={handlePitchChange}
                />
              );
            })}
          </div>

          {/* Highlight window for Polygon A */}
          <div
            className="absolute border-4 rounded-sm pointer-events-none"
            style={{
              left:
                spacing -
                spacing / 2 +
                polygonA.startIndex * (stepWidth + spacing),
              top: 0,
              width: calculateHighlightWidth("A"),
              height: height,
              borderColor: selectorAColor,
              backgroundColor: "transparent",
              transition: "left 0.3s ease-out",
              zIndex: 5,
            }}
          />

          {/* Highlight window for Polygon B */}
          <div
            className="absolute border-4 rounded-sm pointer-events-none"
            style={{
              left:
                spacing -
                spacing / 2 +
                polygonB.startIndex * (stepWidth + spacing),
              top: 0,
              width: calculateHighlightWidth("B"),
              height: height,
              borderColor: selectorBColor,
              backgroundColor: "transparent",
              transition: "left 0.3s ease-out",
              zIndex: 5,
            }}
          />
        </>
      </div>
    </div>
  );
};

export default SeqEditor;
