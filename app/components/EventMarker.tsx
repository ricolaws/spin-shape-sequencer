import React, { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import { Event } from "./Event";

interface EventMarkerProps {
  event: Event;
  size?: number;
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  triggerColor?: string;
  onEventClick?: (index: number) => void;
  onEventHover?: (index: number, hovered: boolean) => void;
}

const EventMarker: React.FC<EventMarkerProps> = ({
  event,
  size = 0.2,
  activeColor = "#ff0000",
  inactiveColor = "#555555",
  hoverColor = "#ffffff",
  triggerColor = "#ffaa00",
  onEventClick,
  onEventHover,
}) => {
  const markerRef = useRef<THREE.Mesh>(null);
  const triggerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // Handle hovering
  useEffect(() => {
    event.hovered = hovered;
    if (onEventHover) {
      onEventHover(event.index, hovered);
    }
  }, [event, hovered, onEventHover]);

  // Animation frame update
  useFrame(() => {
    if (event.triggered && triggerRef.current) {
      // For triggered animation pulse
      triggerRef.current.scale.x = 1 + event.triggerOpacity * 0.5;
      triggerRef.current.scale.y = 1 + event.triggerOpacity * 0.5;
      triggerRef.current.scale.z = 1 + event.triggerOpacity * 0.5;

      // Fade out trigger effect
      if (event.triggerOpacity > 0) {
        event.triggerOpacity -= 0.02;
      } else {
        event.endTrigger();
      }
    }
  });

  const handleClick = () => {
    if (onEventClick) {
      onEventClick(event.index);
    }
  };

  const getColor = () => {
    if (!event.active) return inactiveColor;
    if (hovered) return hoverColor;
    return activeColor;
  };

  return (
    <group position={event.position}>
      {/* Trigger effect circle (only visible when triggered) */}
      {event.triggered && (
        <mesh
          ref={triggerRef}
          position={[0, 0, -0.01]} // Slightly behind the main marker
        >
          <circleGeometry args={[size * 2, 32]} />
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
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <circleGeometry args={[size, 32]} />
        <meshBasicMaterial color={getColor()} />
      </mesh>

      {/* Note value text */}
      <Text
        position={[0, 0, 0.01]} // Slightly in front of the circle
        fontSize={size * 0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {event.getNoteDisplay()}
      </Text>

      {/* Hover ring */}
      {hovered && (
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[size * 1.1, size * 1.2, 32]} />
          <meshBasicMaterial color={hoverColor} />
        </mesh>
      )}
    </group>
  );
};

export default EventMarker;
