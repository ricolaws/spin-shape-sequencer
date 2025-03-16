import React from "react";
import { getNoteDisplay } from "../utils/sequencerUtils";

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
  // Determine background color based on state using colors module
  const getBgColor = () => {
    if (isActive && inCurrentWindow) return "bg-primary";
    if (isActive) return "bg-primary";
    if (inCurrentWindow) return "bg-gray-500"; // Consider adding a specific color for this
    return "bg-secondary";
  };

  return (
    <div
      className={`absolute flex items-center justify-center ${getBgColor()} rounded-sm transition-colors duration-200`}
      style={{
        left: x,
        top: y,
        width,
        height,
        opacity: inCurrentWindow ? 1 : 0.8,
      }}
    >
      <span className="text-white text-s font-medium">
        {getNoteDisplay(pitch)}
      </span>
    </div>
  );
};

export default NoteSlot;
