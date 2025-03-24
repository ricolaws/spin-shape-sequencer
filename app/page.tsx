"use client";

import { useState } from "react";
import Scene from "./components/Scene";
import RNBOShapeSequencer from "./audio/RNBOShapeSequencer";
import { SequencerProvider } from "./context/SequencerProvider";
import SeqEditor from "./components/ui/SeqEditor";

export default function Home() {
  const [sidesA, setSidesA] = useState(5);
  const [sidesB, setSidesB] = useState(3);
  const [angleOfRotation, setAngleOfRotation] = useState(0);

  // Handler function for angle changes from RNBO
  const handleAngleChange = (angle: number) => {
    setAngleOfRotation(angle);
  };

  // Handler function for number of sides changes for polygon A
  const handleSidesAChange = (value: number) => {
    const intValue = Math.round(value);
    setSidesA(intValue);
  };

  // Handler function for number of sides changes for polygon B
  const handleSidesBChange = (value: number) => {
    const intValue = Math.round(value);
    setSidesB(intValue);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-4 sm:p-8 max-w-full overflow-x-hidden">
      <main className="w-full max-w-5xl mx-auto flex flex-col gap-8 row-start-2 items-center">
        <SequencerProvider data-testid="sequencer-provider">
          <RNBOShapeSequencer
            onAngleChange={handleAngleChange}
            onNumCorners_AChange={handleSidesAChange}
            onNumCorners_BChange={handleSidesBChange}
          />

          <div className="w-full">
            <SeqEditor height={180} />
          </div>
          <Scene
            sidesA={sidesA}
            sidesB={sidesB}
            angleOfRotation={angleOfRotation}
          />
        </SequencerProvider>
      </main>
    </div>
  );
}
