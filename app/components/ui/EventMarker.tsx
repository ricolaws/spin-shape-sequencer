import React, { useRef, useState, useEffect } from "react";
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
  triggerColor = "#ffaa00",
  onEventClick,
  onEventHover,
}) => {
  const markerRef = useRef<THREE.Mesh>(null);
  const triggerRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [localActive, setLocalActive] = useState(event.active);
  const [debugTriggered, setDebugTriggered] = useState(false);

  // Debug logging for event properties
  useEffect(() => {
    if (event.triggered && !debugTriggered) {
      setDebugTriggered(true);
    } else if (!event.triggered && debugTriggered) {
      setDebugTriggered(false);
    }
  }, [event.triggered, event.triggerOpacity, event.index, debugTriggered]);

  // Sync local active state with event object
  useEffect(() => {
    setLocalActive(event.active);
  }, [event.active]);

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

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation(); // Prevent click from propagating

    // Update local state immediately for visual feedback
    setLocalActive(!localActive);

    // Call the parent handler to update the actual event
    if (onEventClick) {
      onEventClick(event.index);
    }

    // Log for debugging
    console.log(
      `Clicked event ${
        event.index
      }, new active state should be: ${!localActive}`
    );
  };

  const getColor = () => {
    if (!localActive) return inactiveColor;
    return activeColor;
  };

  // Get text color based on active state
  const getTextColor = () => {
    if (localActive) {
      return "#000000"; // Black text for active events
    } else {
      return "#ffffff"; // White text for inactive events
    }
  };

  return (
    <group position={event.position}>
      {/* Trigger effect circle (only visible when triggered) */}
      {event.triggered && (
        <mesh
          ref={triggerRef}
          position={[0, 0, -0.01]} // Slightly behind the main marker
        >
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

export default EventMarker;
