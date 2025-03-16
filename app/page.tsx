"use client";

import { useState } from "react";
import Scene from "./components/Scene";
import RNBOShapeSequencer from "./components/audio/RNBOShapeSequencer";
import { SequencerProvider } from "./context/SequencerProvider";
// import NoteWindow from "./components/ui/NoteWindow";
import StepSelector from "./components/ui/StepSelector";
import { colors } from "./styles/colors";

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
      <main className="w-full max-w-6xl mx-auto flex flex-col gap-8 row-start-2 items-center">
        <SequencerProvider data-testid="sequencer-provider">
          <RNBOShapeSequencer
            onAngleChange={handleAngleChange}
            onNumCornersChange={handleSidesChange}
          />
          {/* <NoteWindow /> */}
          <StepSelector
            height={250}
            minValue={48} // C3
            maxValue={72} // C5
            className="w-full mt-4"
            activeStepColor={colors.primary}
            inactiveStepColor="#808080"
            cellBGColor="#323232"
            selectorColor={colors.primary}
          />
          <Scene sides={sides} angleOfRotation={angleOfRotation} />
        </SequencerProvider>
      </main>
    </div>
  );
}
