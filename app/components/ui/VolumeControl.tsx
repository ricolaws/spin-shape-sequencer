import { useState } from "react";
import { getMasterVolume, setMasterVolume } from "../audio/RNBOCore";

const VolumeControl: React.FC = () => {
  const [volume, setVolume] = useState(getMasterVolume());

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    setMasterVolume(newVolume);
  };

  return (
    <div className="mb-6">
      <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
        <label className="text-sm font-medium">Master Volume:</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={volume}
          onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
          className="w-full accent-[var(--primary)] h-2 rounded-lg appearance-none bg-[var(--secondary)]"
        />
        <span className="text-sm w-20 text-center">
          {Math.round(volume * 100)}%
        </span>
      </div>
    </div>
  );
};

export default VolumeControl;
