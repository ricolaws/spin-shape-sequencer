"use client";

import { useEffect, useState } from "react";
import Scene from "./components/Scene";
import RNBODevice from "./components/RNBODevice";

export default function Home() {
  const [sides, setSides] = useState(5);
  const [angleOfRotation, setAngleOfRotation] = useState(0);

  // Simple constant rotation for testing
  useEffect(() => {
    const rotationSpeed = 30; // degrees per second
    const frameRate = 60; // frames per second
    const rotationPerFrame = rotationSpeed / frameRate;

    const rotationInterval = setInterval(() => {
      setAngleOfRotation((prevAngle) => {
        // Add rotation and wrap around to stay within 0-360
        const newAngle = (prevAngle + rotationPerFrame) % 360;
        return newAngle;
      });
    }, 1000 / frameRate);

    return () => clearInterval(rotationInterval);
  }, []);

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20">
      <main className="w-full flex flex-col gap-8 row-start-2 items-center sm:items-start">
        <div className="p-4 bg-gray-100 flex items-center space-x-4">
          <label className="font-medium">Sides: {sides}</label>
          <input
            type="range"
            min="3"
            max="8"
            value={sides}
            onChange={(e) => setSides(parseInt(e.target.value))}
            className="w-64"
          />
        </div>
        <div className="ml-8">
          <span className="font-medium">
            Rotation: {angleOfRotation.toFixed(1)}°
          </span>
        </div>
        <RNBODevice />
        <Scene sides={sides} angleOfRotation={angleOfRotation} />
      </main>
    </div>
  );
}
