"use client";

import { useState } from "react";
import Scene from "./components/Scene";
import RNBOShapeSequencer from "./components/audio/RNBOShapeSequencer";
import { SequencerProvider } from "./context/SequencerProvider";

export default function Home() {
  const [sides, setSides] = useState(5);
  const [angleOfRotation, setAngleOfRotation] = useState(0);

  // Handler function for angle changes from RNBO
  const handleAngleChange = (angle: number) => {
    setAngleOfRotation(angle);
  };

  // Handler function for number of sides changes
  const handleSidesChange = (value: number) => {
    const intValue = Math.round(value);
    setSides(intValue);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-4 sm:p-8 max-w-full overflow-x-hidden">
      <main className="w-full max-w-5xl mx-auto flex flex-col gap-8 row-start-2 items-center">
        <div className="w-full px-4">
          <span className="font-medium">
            Rotation: {angleOfRotation.toFixed(1)}°
          </span>
        </div>

        <SequencerProvider>
          <RNBOShapeSequencer
            onAngleChange={handleAngleChange}
            onNumCornersChange={handleSidesChange}
          />
          <Scene sides={sides} angleOfRotation={angleOfRotation} />
        </SequencerProvider>
      </main>
    </div>
  );
}
