import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

interface DynamicPolygonProps {
  sides: number;
  radius?: number;
  color?: string;
  angleOfRotation: number; // 0-360 degree value controlled externally
  position?: [number, number, number];
}

const DynamicPolygon: React.FC<DynamicPolygonProps> = ({
  sides,
  radius = 1,
  color = "#1e88e5",
  angleOfRotation = 0,
  position = [0, 0, 0],
}) => {
  // Validate sides is between 3 and 8
  const validSides = Math.max(3, Math.min(8, Math.round(sides)));
  const meshRef = useRef<THREE.Mesh>(null);

  // Create polygon shape based on number of sides
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const angleStep = (Math.PI * 2) / validSides;

    // Start at the rightmost point
    shape.moveTo(radius, 0);

    // Draw the polygon by calculating points around a circle
    for (let i = 1; i <= validSides; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      shape.lineTo(x, y);
    }

    return new THREE.ShapeGeometry(shape);
  }, [validSides, radius]);

  // Update rotation when angleOfRotation changes
  useEffect(() => {
    if (meshRef.current) {
      // Convert 0-360 degrees to radians (0-2π)
      meshRef.current.rotation.z = (angleOfRotation * Math.PI) / 180;
    }
  }, [angleOfRotation]);

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      position={new THREE.Vector3(...position)}
    >
      <meshStandardMaterial color={color} side={THREE.DoubleSide} />
    </mesh>
  );
};

export default DynamicPolygon;
