import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";
import * as THREE from "three";
import EventMarker from "./EventMarker";
import { Event } from "../Event";

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
      lineWidth = 2,
      markerSize = 0.2,
      activeColor = "#ffffff",
      inactiveColor = "#666666",
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
    const lastPropsRef = useRef({
      eventCount,
      radius,
      noteValues: noteValues.join(","),
      initialActiveEvents: initialActiveEvents.join(","),
    });
    const initCalledRef = useRef(false);

    // Create circle geometry only once or when radius/segments change
    useEffect(() => {
      if (!geometryRef.current) {
        console.log("Creating circle geometry");
        geometryRef.current = createCircleGeometry(radius, segments);
      } else if (lastPropsRef.current.radius !== radius) {
        console.log("Updating circle geometry due to radius change");
        geometryRef.current = createCircleGeometry(radius, segments);
        lastPropsRef.current.radius = radius;
      }
    }, [radius, segments]);

    // Check if we need to reinitialize events
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const shouldReinitialize = () => {
      if (!initCalledRef.current) {
        initCalledRef.current = true;
        return true;
      }

      const currentProps = {
        eventCount,
        radius,
        noteValues: noteValues.join(","),
        initialActiveEvents: initialActiveEvents.join(","),
      };

      // Deep compare relevant props
      const needsUpdate =
        lastPropsRef.current.eventCount !== currentProps.eventCount ||
        lastPropsRef.current.noteValues !== currentProps.noteValues ||
        lastPropsRef.current.initialActiveEvents !==
          currentProps.initialActiveEvents;

      if (needsUpdate) {
        console.log("Props changed, reinitializing events");
        lastPropsRef.current = { ...currentProps };
      }

      return needsUpdate;
    };

    // Initialize events ONLY when necessary
    useEffect(() => {
      if (!shouldReinitialize()) {
        return;
      }

      console.log(
        `SeqRing: Initializing events. Count: ${eventCount}, Notes: ${noteValues.length}, Active: ${initialActiveEvents.length}`
      );

      const newEvents: Event[] = [];

      for (let i = 0; i < eventCount; i++) {
        const noteValue = noteValues[i] || 60 + i; // Default to C4 + offset if not provided
        const active =
          initialActiveEvents[i] !== undefined ? initialActiveEvents[i] : false;

        const event = new Event(i, noteValue, active);

        const theta = (i / eventCount) * Math.PI * 2;

        event.setPosition(radius, theta);
        newEvents.push(event);
      }

      console.log(`SeqRing: ${newEvents.length} events created`);
      setEvents(newEvents);
    }, [
      eventCount,
      radius,
      noteValues,
      initialActiveEvents,
      shouldReinitialize,
    ]);

    // Handle event click
    const handleEventClick = (index: number) => {
      console.log(`SeqRing received click for event ${index}`);

      setEvents((prevEvents) => {
        // Create a deep copy of the events array
        const newEvents = [...prevEvents];

        // Get the event and toggle its state
        const event = newEvents[index];
        event.active = !event.active;

        console.log(`Event ${index} active state toggled to: ${event.active}`);

        // Call callback if provided
        if (onEventToggle) {
          onEventToggle(index, event.active);
        }

        return newEvents;
      });
    };

    // Public method to trigger an event (to be called from parent)
    const triggerEvent = (index: number) => {
      if (index >= 0 && index < events.length) {
        // Directly trigger the event without unnecessary state updates
        // This approach avoids re-rendering the entire component
        if (events[index]) {
          events[index].trigger();
        }
      } else {
        console.warn(
          `SeqRing: Invalid event index ${index} (events length: ${events.length})`
        );
      }
    };

    // Expose the triggerEvent method to parent components
    useImperativeHandle(
      ref,
      () => ({
        triggerEvent,
      }),
      [events]
    ); // Important: depend on events array

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
