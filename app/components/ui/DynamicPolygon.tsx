import React, { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";

interface DynamicPolygonProps {
  sides: number;
  outerRadius?: number;
  innerRadius?: number;
  height?: number;
  color: string | THREE.Color;
  angleOfRotation: number;
  position?: [number, number, number];
  transparent?: boolean;
  metalness?: number;
  roughness?: number;
}

const DynamicPolygon: React.FC<DynamicPolygonProps> = ({
  sides,
  outerRadius = 1,
  innerRadius = 0.8,
  height = 0.2,
  color,
  angleOfRotation,
  position = [0, 0, 0],
  transparent = true,
  metalness = 1.4,
  roughness = 0.37,
}) => {
  const validSides = Math.max(3, Math.min(8, Math.round(sides)));
  const groupRef = useRef<THREE.Group>(null);

  // Create the ring/corridor geometry
  const geometry = useMemo(() => {
    // Create a shape with a hole for the inner radius
    const shape = new THREE.Shape();
    const hole = new THREE.Path();
    const angleStep = (Math.PI * 2) / validSides;

    // Draw the outer polygon shape
    for (let i = 0; i < validSides; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * outerRadius;
      const y = Math.sin(angle) * outerRadius;

      if (i === 0) {
        shape.moveTo(x, y);
      } else {
        shape.lineTo(x, y);
      }
    }
    shape.closePath();

    // Draw the inner polygon hole (smaller version of outer shape)
    for (let i = 0; i < validSides; i++) {
      const angle = i * angleStep;
      const x = Math.cos(angle) * innerRadius;
      const y = Math.sin(angle) * innerRadius;

      if (i === 0) {
        hole.moveTo(x, y);
      } else {
        hole.lineTo(x, y);
      }
    }
    hole.closePath();

    // Add the hole to the shape
    shape.holes.push(hole);

    // Create an extruded geometry from the shape
    const extrudeSettings = {
      depth: height,
      bevelEnabled: false,
    };

    const ringGeometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

    // Adjust the vertical position
    ringGeometry.translate(0, 0, -height / 2);

    // The correct rotation to make it lie flat (XY plane)
    ringGeometry.rotateX(-Math.PI / 2);

    return ringGeometry;
  }, [validSides, outerRadius, innerRadius, height]);

  // Update rotation when angleOfRotation changes
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = (angleOfRotation * Math.PI) / 180;
    }
  }, [angleOfRotation, validSides, outerRadius]);

  return (
    <>
      <group
        ref={groupRef}
        position={new THREE.Vector3(...position)}
        rotation={[Math.PI / 2, 0, 0]} // This rotates the entire group to lie flat
      >
        <mesh geometry={geometry}>
          <meshStandardMaterial
            color={color}
            transparent={transparent}
            metalness={metalness}
            roughness={roughness}
            envMapIntensity={1.5}
            side={THREE.DoubleSide} // Render both inside and outside faces
          />
        </mesh>
      </group>
    </>
  );
};

export default DynamicPolygon;
