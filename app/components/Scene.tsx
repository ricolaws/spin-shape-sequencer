import React, { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment, OrbitControls } from "@react-three/drei";
import DynamicPolygon3D from "./DynamicPolygon3D";
import {
  Bloom,
  ChromaticAberration,
  EffectComposer,
} from "@react-three/postprocessing";
import SeqRing, { RingRef } from "./SeqRing";

interface SceneProps {
  sides: number;
  angleOfRotation: number;
  className?: string;
}

const Scene: React.FC<SceneProps> = ({
  sides,
  angleOfRotation,
  className = "",
}) => {
  const ringRef = useRef<RingRef>(null);

  // Dummy data for initialization
  const dummyNoteValues = [60, 62, 64, 65, 67, 69, 71, 72]; // C major scale
  const dummyActiveEvents = [true, true, true, true, true, false, true, false];

  // Handle event toggling - connect to your RNBO device
  const handleEventToggle = (index: number, active: boolean) => {
    console.log(`Event ${index} ${active ? "activated" : "deactivated"}`);
    // Here you would send a message to your RNBO device to update state
  };

  return (
    <div
      id="canvas-container"
      className={`w-11/12 aspect-square mx-auto ${className}`}
    >
      <Canvas camera={{ position: [0, 0, 5], fov: 60 }}>
        <color attach="background" args={["#c1c1c1"]} />
        <Environment preset="night" environmentIntensity={0.8} />
        <ambientLight intensity={0.1} />
        <directionalLight position={[3, 13, 2]} intensity={0.8} />
        <OrbitControls enableZoom={false} />
        <DynamicPolygon3D
          sides={sides}
          outerRadius={2}
          innerRadius={1.8}
          height={0.2}
          color="#dbdbdb"
          transparent={true}
          metalness={1.8}
          roughness={0.5}
          angleOfRotation={angleOfRotation}
        />
        <SeqRing
          ref={ringRef}
          radius={2.1}
          eventCount={8}
          noteValues={dummyNoteValues}
          initialActiveEvents={dummyActiveEvents}
          onEventToggle={handleEventToggle}
          color="#ffffff"
          activeColor="#ff4500"
          inactiveColor="#555555"
          markerSize={0.15}
        />
        <EffectComposer>
          <Bloom
            intensity={0.12}
            luminanceThreshold={0.8}
            luminanceSmoothing={0.8}
          />
          <ChromaticAberration opacity={2} />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene;
