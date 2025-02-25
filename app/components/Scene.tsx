import React from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import DynamicPolygon from "./DynamicPolygon";

interface SceneProps {
  sides: number; // Number of sides (3-8)
  angleOfRotation: number; // Rotation angle in degrees (0-360)
  className?: string;
}

const Scene: React.FC<SceneProps> = ({
  sides,
  angleOfRotation,
  className = "",
}) => {
  return (
    <div id="canvas-container" className={`w-11/12 aspect-square ${className}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }}>
        <color attach="background" args={["#111"]} />
        <ambientLight intensity={0.3} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <gridHelper args={[10, 10]} rotation={[Math.PI / 2, 0, 0]} />
        <OrbitControls enableZoom={false} />

        <DynamicPolygon
          sides={sides}
          radius={2}
          color="#4dabf5"
          angleOfRotation={angleOfRotation}
        />
      </Canvas>
    </div>
  );
};

export default Scene;
