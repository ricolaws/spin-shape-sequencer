import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";

interface DynamicPolygonProps {
  sides: number;
  radius?: number;
  color?: string;
  lineWidth?: number;
  angleOfRotation: number; // 0-360 degree value controlled externally
  position?: [number, number, number];
}

const DynamicPolygon: React.FC<DynamicPolygonProps> = ({
  sides,
  radius = 1,
  color = "#1e88e5",
  lineWidth = 2,
  angleOfRotation,
  position = [0, 0, 0],
}) => {
  // Validate sides is between 3 and 8
  const validSides = Math.max(3, Math.min(8, Math.round(sides)));
  const groupRef = useRef<THREE.Group>(null);

  // Create polygon points based on number of sides
  const points = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const angleStep = (Math.PI * 2) / validSides;

    // Draw the polygon by calculating points around a circle
    for (let i = 0; i <= validSides; i++) {
      const angle = (i % validSides) * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      points.push(new THREE.Vector3(x, y, 0));
    }

    return points;
  }, [validSides, radius]);

  // Update rotation when angleOfRotation changes
  useEffect(() => {
    if (groupRef.current) {
      // Convert 0-360 degrees to radians (0-2π)
      groupRef.current.rotation.z = (angleOfRotation * Math.PI) / 180;
    }
  }, [angleOfRotation]);

  return (
    <group ref={groupRef} position={new THREE.Vector3(...position)}>
      <Line points={points} color={color} lineWidth={lineWidth} />
    </group>
  );
};

export default DynamicPolygon;
