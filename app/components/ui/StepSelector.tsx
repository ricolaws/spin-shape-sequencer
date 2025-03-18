import React, { useEffect, useRef, useState } from "react";
import StepCell from "./StepCell";
import { useSequencer } from "../../context/SequencerProvider";
import { logger } from "../utils/DebugLogger";
import RangeSelector from "./RangeSelector";

interface StepSelectorProps {
  className?: string;
  height?: number;
  minValue?: number;
  maxValue?: number;
  activeStepColor?: string;
  inactiveStepColor?: string;
  cellBGColor?: string;
  selectorColor?: string;
}

const StepSelector: React.FC<StepSelectorProps> = ({
  className = "",
  height = 200,
  minValue = 48,
  maxValue = 72,
  activeStepColor = "#4080bf",
  inactiveStepColor = "#808080",
  cellBGColor = "#323232",
  selectorColor = "#c1c1c1",
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

  const totalSteps = state.events.notes.length;
  const stepWidth = (dimensions.width * 0.75) / totalSteps;
  const spacing = (dimensions.width * 0.25) / (totalSteps + 1);

  // Calculate the starting index based on the window offset
  const maxOffset = totalSteps - state.numEvents;
  const startIndex = Math.round(state.noteWindowOffset * maxOffset);

  // Function to calculate window highlight width
  const calculateHighlightWidth = () => {
    return (
      state.numEvents * stepWidth +
      (state.numEvents - 1) * spacing +
      spacing +
      2
    );
  };

  return (
    <div className="w-full mb-4">
      <RangeSelector
        minPossibleValue={0}
        maxPossibleValue={totalSteps - 1}
        minRangeSize={3}
        handleColor={activeStepColor}
        trackColor={cellBGColor}
        rangeColor={selectorColor}
        height={40}
        className="mb-4"
      />

      <div
        ref={containerRef}
        className={`relative w-full bg-[var(--background)] rounded-md overflow-hidden ${className}`}
        style={{ height: `${height}px` }}
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
    </div>
  );
};

export default StepSelector;
