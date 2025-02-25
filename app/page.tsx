"use client";

import { useState } from "react";
import Scene from "./components/Scene";
import RNBODevice from "./components/audio/RNBODevice";

export default function Home() {
  const [sides, setSides] = useState(5);
  const [angleOfRotation, setAngleOfRotation] = useState(0);

  // Handler function for angle changes from RNBO
  const handleAngleChange = (angle: number) => {
    setAngleOfRotation(angle);
  };

  // Handler function for number of sides changes
  const handleSidesChange = (value: number) => {
    // Ensure the value is an integer
    const intValue = Math.round(value);
    setSides(intValue);
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="w-full flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="ml-8">
          <span className="font-medium">
            Rotation: {angleOfRotation.toFixed(1)}°
          </span>
        </div>
        <RNBODevice
          onAngleChange={handleAngleChange}
          onNumCornersChange={handleSidesChange}
        />
        <Scene sides={sides} angleOfRotation={angleOfRotation} />
      </main>
    </div>
  );
}
