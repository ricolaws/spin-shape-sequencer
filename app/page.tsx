"use client";

import { useEffect, useState, useRef } from "react";
import Scene from "./components/Scene";
import RNBODevice from "./components/audio/RNBODevice";

export default function Home() {
  const [sides, setSides] = useState(5);
  const [angleOfRotation, setAngleOfRotation] = useState(0);
  // Add a debugging state to see the last message time
  const [lastUpdateTime, setLastUpdateTime] = useState("None");
  // Use a ref to track the last angle value received
  const lastAngleRef = useRef(0);

  // Handler function that will be passed to the RNBODevice component
  const handleAngleChange = (angle: number) => {
    // Store the last angle value in a ref for debugging
    lastAngleRef.current = angle;

    // Ensure angle is in the range 0-360
    const normalizedAngle = ((angle % 360) + 360) % 360;

    // Update the state
    setAngleOfRotation(normalizedAngle);

    // For debugging: update the last time we received a message
    setLastUpdateTime(
      new Date().toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
      })
    );
  };

  // Debug effect to monitor state changes
  useEffect(() => {
    console.log(
      `AngleOfRotation state updated to: ${angleOfRotation.toFixed(2)}`
    );

    // Return empty cleanup to avoid creating side effects
    return () => {};
  }, [angleOfRotation]);

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
          <div className="text-sm text-gray-500">
            Last update: {lastUpdateTime} | Last received angle:{" "}
            {lastAngleRef.current.toFixed(1)}°
          </div>
        </div>
        <RNBODevice onAngleChange={handleAngleChange} />
        <Scene sides={sides} angleOfRotation={angleOfRotation} />
      </main>
    </div>
  );
}
