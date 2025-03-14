/**
 * NoteSlot component represents a single note in the sequence.
 *
 * It displays the note name and is styled based on whether it's active
 * and whether it's in the current window.
 */
import React from "react";

interface NoteSlotProps {
  index: number;
  pitch: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isActive?: boolean;
  inCurrentWindow?: boolean;
}

const NoteSlot: React.FC<NoteSlotProps> = ({
  pitch,
  x,
  y,
  width,
  height,
  isActive = false,
  inCurrentWindow = false,
}) => {
  // Function to convert MIDI note to note name
  const getNoteDisplay = (pitch: number): string => {
    if (pitch === 0) return "✖︎";

    const noteNames = [
      "C",
      "C♯",
      "D",
      "D♯",
      "E",
      "F",
      "F♯",
      "G",
      "G♯",
      "A",
      "A♯",
      "B",
    ];
    const noteName = noteNames[pitch % 12];
    const octave = Math.floor(pitch / 12) - 2;
    return `${noteName}${octave}`;
  };

  // Determine background color based on state
  const getBgColor = () => {
    if (isActive && inCurrentWindow) return "bg-green-500";
    if (isActive) return "bg-green-700";
    if (inCurrentWindow) return "bg-gray-500";
    return "bg-gray-700";
  };

  return (
    <div
      className={`absolute flex items-center justify-center ${getBgColor()} rounded-sm transition-colors duration-200`}
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: inCurrentWindow ? 1 : 0.7,
      }}
    >
      <span className="text-white text-xs font-medium">
        {getNoteDisplay(pitch)}
      </span>
    </div>
  );
};

export default NoteSlot;
