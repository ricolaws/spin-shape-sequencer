"use client";

import { useState } from "react";
import Scene from "./components/Scene";
import RNBOShapeSequencer from "./audio/RNBOShapeSequencer";
import { SequencerProvider } from "./context/SequencerProvider";
import SeqEditor from "./components/ui/SeqEditor";

export default function Home() {
  const [angleOfRotation, setAngleOfRotation] = useState(0);

  // Handler function for angle changes from RNBO
  const handleAngleChange = (angle: number) => {
    setAngleOfRotation(angle);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] min-h-screen p-4 sm:p-8 max-w-full overflow-x-hidden">
      <main className="w-full max-w-5xl mx-auto flex flex-col gap-8 row-start-2 items-center">
        <SequencerProvider data-testid="sequencer-provider">
          <RNBOShapeSequencer onAngleChange={handleAngleChange} />

          <div className="w-full">
            <SeqEditor height={180} />
          </div>
          <Scene angleOfRotation={angleOfRotation} />
        </SequencerProvider>
      </main>
    </div>
  );
}
