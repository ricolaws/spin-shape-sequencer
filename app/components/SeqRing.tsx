import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import EventMarker from "./EventMarker";
import { Event } from "./Event";

interface SeqRingProps {
  radius?: number;
  eventCount?: number;
  lineWidth?: number;
  color?: string;
  segments?: number;
  markerSize?: number;
  activeColor?: string;
  inactiveColor?: string;
  hoverColor?: string;
  triggerColor?: string;
  noteValues?: number[];
  initialActiveEvents?: boolean[];
  onEventToggle?: (index: number, active: boolean) => void;
}

export interface RingRef {
  triggerEvent: (index: number) => void;
}

// Create and memoize circle geometry outside the component
const createCircleGeometry = (
  radius: number,
  segments: number
): THREE.BufferGeometry => {
  const circlePoints = [];
  for (let i = 0; i <= segments; i++) {
    const theta = (i / segments) * Math.PI * 2;
    const x = radius * Math.cos(theta);
    const y = radius * Math.sin(theta);
    circlePoints.push(new THREE.Vector3(x, y, 0));
  }
  return new THREE.BufferGeometry().setFromPoints(circlePoints);
};

const SeqRing = forwardRef<RingRef, SeqRingProps>(
  (
    {
      radius = 2,
      eventCount = 8,
      segments = 64,
      color = "#ffffff",
      lineWidth = 1,
      markerSize = 0.2,
      activeColor = "#ff0000",
      inactiveColor = "#555555",
      hoverColor = "#ffffff",
      triggerColor = "#ffaa00",
      noteValues = [],
      initialActiveEvents = [],
      onEventToggle,
    },
    ref
  ) => {
    // Create state at the top level
    const [events, setEvents] = useState<Event[]>([]);
    const groupRef = useRef<THREE.Group>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);

    // Create circle geometry on mount or when parameters change
    useEffect(() => {
      geometryRef.current = createCircleGeometry(radius, segments);
    }, [radius, segments]);

    // Initialize events
    useEffect(() => {
      const newEvents: Event[] = [];

      for (let i = 0; i < eventCount; i++) {
        const noteValue = noteValues[i] || 60 + i; // Default to C4 + offset if not provided
        const active =
          initialActiveEvents[i] !== undefined ? initialActiveEvents[i] : false;

        const event = new Event(i, noteValue, active);

        // Calculate angle (starting from the top, like a clock)
        const theta = (i / eventCount) * Math.PI * 2 - Math.PI / 2;
        event.setPosition(radius, theta);

        newEvents.push(event);
      }

      setEvents(newEvents);
    }, [eventCount, radius, noteValues, initialActiveEvents]);

    // Handle event click
    const handleEventClick = (index: number) => {
      setEvents((prevEvents) => {
        const newEvents = [...prevEvents];
        const event = newEvents[index];
        event.toggle();

        if (onEventToggle) {
          onEventToggle(index, event.active);
        }

        return newEvents;
      });
    };

    // Public method to trigger an event (to be called from parent)
    const triggerEvent = (index: number) => {
      if (index >= 0 && index < events.length) {
        setEvents((prevEvents) => {
          const newEvents = [...prevEvents];
          newEvents[index].trigger();
          return newEvents;
        });
      }
    };

    // Expose the triggerEvent method to parent components
    useImperativeHandle(ref, () => ({
      triggerEvent,
    }));

    // Create the geometry only if not already created
    if (!geometryRef.current) {
      geometryRef.current = createCircleGeometry(radius, segments);
    }

    return (
      <group ref={groupRef}>
        {/* Main circle outline */}
        <line>
          <bufferGeometry
            attach="geometry"
            {...(geometryRef.current || new THREE.BufferGeometry())}
          />
          <lineBasicMaterial
            attach="material"
            color={color}
            linewidth={lineWidth}
          />
        </line>

        {/* Event markers */}
        {events.map((event) => (
          <EventMarker
            key={event.index}
            event={event}
            size={markerSize}
            activeColor={activeColor}
            inactiveColor={inactiveColor}
            hoverColor={hoverColor}
            triggerColor={triggerColor}
            onEventClick={handleEventClick}
          />
        ))}
      </group>
    );
  }
);

// Add display name to fix eslint warning
SeqRing.displayName = "SeqRing";

export default SeqRing;
