/**
 * NoteWindow component displays all the notes in the sequence and provides a
 * visual representation of the "window" of currently active notes.
 *
 * It allows clicking to position the window, which determines which notes are
 * shown in the ring sequencer.
 */
import React, { useEffect, useRef, useState } from "react";
import { useSequencer } from "../../context/SequencerProvider";
import NoteSlot from "./NoteSlot";

interface NoteWindowProps {
  className?: string;
}

const NoteWindow: React.FC<NoteWindowProps> = ({ className = "" }) => {
  const { state, setNoteWindowOffset } = useSequencer();
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Calculate dimensions when component mounts
  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height });
    }

    const handleResize = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Calculate metrics for note slots and window
  const totalSteps = state.events.notes.length; // Total number of notes (16)
  const stepWidth = (dimensions.width * 0.8) / totalSteps; // 90% of width divided by steps
  const stepHeight = stepWidth * 1.5; // Height of each note slot
  const spacing = (dimensions.width * 0.2) / (totalSteps + 1);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;

    // Calculate which step was clicked
    const clickedStep = Math.floor((x - spacing) / (stepWidth + spacing));

    // Ensure we don't go out of bounds
    if (clickedStep >= 0 && clickedStep < totalSteps) {
      console.log(`Clicked on step ${clickedStep}`);

      // Calculate the new offset based on the clicked position
      const maxStartIndex = totalSteps - state.numEvents;

      if (maxStartIndex <= 0) {
        return; // Can't move if window size equals or exceeds total steps
      }

      // Determine the new starting index
      let newStartIndex = clickedStep;

      // Make sure the window doesn't go beyond the end
      if (newStartIndex + state.numEvents > totalSteps) {
        newStartIndex = totalSteps - state.numEvents;
      }

      // Calculate offset (between 0-1)
      const newOffset = newStartIndex / maxStartIndex;
      console.log(
        `New window offset: ${newOffset}, starting at index ${newStartIndex}`
      );

      // Update the offset in the context
      setNoteWindowOffset(newOffset);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-32 bg-[#c1c1c1] rounded-md overflow-hidden ${className}`}
      onClick={handleClick}
    >
      {dimensions.width > 0 && (
        <>
          <div className="absolute inset-0">
            {state.events.notes.map((note, index) => {
              // Calculate if this note is in the current window
              const maxOffset = totalSteps - state.numEvents;
              const startIndex = Math.round(state.noteWindowOffset * maxOffset);
              const inCurrentWindow =
                index >= startIndex && index < startIndex + state.numEvents;

              return (
                <NoteSlot
                  key={index}
                  index={index}
                  pitch={note.pitch}
                  width={stepWidth}
                  height={stepHeight}
                  x={spacing + index * (stepWidth + spacing)}
                  y={(dimensions.height - stepHeight) / 2}
                  isActive={state.events.active[index]}
                  inCurrentWindow={inCurrentWindow}
                />
              );
            })}
          </div>

          {/* Highlight window for active events */}
          <div
            className="absolute border-4 border-stone-700 rounded-sm pointer-events-none z-10"
            style={{
              left:
                spacing +
                state.noteWindowOffset *
                  (totalSteps - state.numEvents) *
                  (stepWidth + spacing),
              top: (dimensions.height - stepHeight - spacing) / 2,
              width: state.numEvents * (stepWidth + spacing) - spacing,
              height: stepHeight + spacing,
              transition: "left 0.3s ease-out",
            }}
          />
        </>
      )}
    </div>
  );
};

export default NoteWindow;
