import React, { useRef, useState, useCallback, memo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "../Event";
import { ThreeEvent } from "@react-three/fiber";

interface EventMarkerProps {
  event: Event;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  triggerColor?: string;
  onEventClick?: (index: number) => void;
  onEventHover?: (index: number, hovered: boolean) => void;
}

const EventMarker: React.FC<EventMarkerProps> = ({
  event,
  size = 0.2,
  activeColor = "#ffffff",
  inactiveColor = "#666666",
  triggerColor = "#ff4500",
  onEventClick,
}) => {
  const markerRef = useRef<THREE.Mesh>(null);
  const triggerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Handle click event
  const handleClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      e.stopPropagation();
      if (onEventClick) {
        onEventClick(event.index);
      }
    },
    [event, onEventClick]
  );

  // Handle hover
  const handlePointerOver = useCallback(() => setHovered(true), []);
  const handlePointerOut = useCallback(() => setHovered(false), []);

  // Animation frame update for trigger effect
  useFrame(() => {
    if (event.triggered && triggerRef.current) {
      // Get the animation progress from 1 down to 0
      const animationProgress = Math.max(0, event.triggerOpacity);
      const scale = 0.5 + animationProgress;

      triggerRef.current.scale.set(scale, scale, scale);
      event.triggerOpacity -= 0.04;

      // End the animation when opacity is low enough
      if (event.triggerOpacity <= 0) {
        event.triggerOpacity = 0;
        event.endTrigger();
      }

      // Force update
      if (markerRef.current) {
        markerRef.current.updateMatrix();
      }
    }
  });

  // Get colors based on active state
  const getColor = useCallback(() => {
    return event.active ? activeColor : inactiveColor;
  }, [event.active, activeColor, inactiveColor]);

  const getTextColor = useCallback(() => {
    return event.active ? "#000000" : "#ffffff";
  }, [event.active]);

  return (
    <group position={event.position}>
      {/* Trigger effect circle */}
      {event.triggered && (
        <mesh ref={triggerRef} position={[0, 0, -0.01]}>
          <circleGeometry args={[size * 1.2, 32]} />
          <meshBasicMaterial
            color={triggerColor}
            transparent={true}
            opacity={event.triggerOpacity}
          />
        </mesh>
      )}

      {/* Main marker circle */}
      <mesh
        ref={markerRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color={getColor()} />
      </mesh>

      {/* Note value text */}
      <Text
        position={[0, 0, 0.01]}
        fontSize={size * 0.8}
        color={getTextColor()}
        anchorX="center"
        anchorY="middle"
      >
        {event.getNoteDisplay()}
      </Text>

      {/* Hover ring */}
      {hovered && (
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[size * 1.1, size * 1.2, 32]} />
          <meshBasicMaterial color={activeColor} />
        </mesh>
      )}
    </group>
  );
};

export default memo(EventMarker);
