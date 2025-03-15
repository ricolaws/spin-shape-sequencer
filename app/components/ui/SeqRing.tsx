import React, {
  useState,
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  useMemo,
  useCallback,
} from "react";
import * as THREE from "three";
import EventMarker from "./EventMarker";
import { Event } from "../Event";
import { logger } from "../DebugLogger";

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
    // References to track initialization and structural changes
    const isInitializedRef = useRef(false);
    const prevStructuralPropsRef = useRef({
      eventCount,
      radius,
      noteValues: noteValues.map((n) => n).join(","),
    });

    // Separate state for events to avoid unnecessary recreations
    const [events, setEvents] = useState<Event[]>([]);

    // Refs for Three.js objects
    const groupRef = useRef<THREE.Group>(null);
    const geometryRef = useRef<THREE.BufferGeometry | null>(null);

    // Memoize circle geometry based only on radius and segments
    const circleGeometry = useMemo(() => {
      return createCircleGeometry(radius, segments);
    }, [radius, segments]);

    // Keep the geometry ref updated
    useEffect(() => {
      geometryRef.current = circleGeometry;
    }, [circleGeometry]);

    // Function to check if structural props have changed
    const hasStructuralPropsChanged = useCallback(() => {
      const currentStructuralProps = {
        eventCount,
        radius,
        noteValues: noteValues.map((n) => n).join(","),
      };

      const hasChanged =
        prevStructuralPropsRef.current.eventCount !==
          currentStructuralProps.eventCount ||
        prevStructuralPropsRef.current.radius !==
          currentStructuralProps.radius ||
        prevStructuralPropsRef.current.noteValues !==
          currentStructuralProps.noteValues;

      if (hasChanged) {
        prevStructuralPropsRef.current = { ...currentStructuralProps };
      }

      return hasChanged;
    }, [eventCount, radius, noteValues]);

    // Initialize or rebuild events when structural props change
    useEffect(() => {
      const shouldRebuildEvents =
        !isInitializedRef.current || hasStructuralPropsChanged();

      if (!shouldRebuildEvents) {
        return;
      }

      logger.log(
        `SeqRing: ${
          isInitializedRef.current ? "Rebuilding" : "Initializing"
        } events due to structural changes.`
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

      setEvents(newEvents);
      isInitializedRef.current = true;

      logger.log(`SeqRing: ${newEvents.length} events created/updated`);
    }, [
      eventCount,
      radius,
      noteValues,
      initialActiveEvents,
      hasStructuralPropsChanged,
    ]);

    // We're DISABLING this effect that was causing the circular updates.
    // The parent (SequencerProvider) should now be the single source of truth for active states.
    // The local events will be updated only when the initialActiveEvents prop changes
    // during initialization or when structure changes.

    // Initialize events with active states, but don't update them based on prop changes
    // We'll let the parent handle active state changes and SequencerProvider will have
    // the authoritative state

    // Handle event click with useCallback to maintain reference stability
    const handleEventClick = useCallback(
      (index: number) => {
        logger.log(`SeqRing received click for event ${index}`);

        // Instead of toggling the event directly and then calling the callback,
        // we'll only call the callback and let parent handle the state
        if (onEventToggle) {
          // Get the current active state of the event
          const currentActive = events[index]?.active || false;

          // Call the parent's toggle function with the CURRENT state
          // so it knows what to toggle it to
          onEventToggle(index, !currentActive);

          logger.log(
            `Event ${index} requested toggle from ${currentActive} to ${!currentActive}`
          );
        }
      },
      [onEventToggle, events]
    );

    // Trigger event method with useCallback
    const triggerEvent = useCallback(
      (index: number) => {
        if (index >= 0 && index < events.length) {
          // Directly trigger the event without unnecessary state updates
          if (events[index]) {
            const triggered = events[index].trigger();
            logger.log(
              `SeqRing: Triggered event ${index}, result: ${triggered}`
            );

            // Force a small state update to trigger a re-render for animation
            if (triggered) {
              setEvents((prevEvents) => [...prevEvents]);
            }
          }
        } else {
          logger.warn(
            `SeqRing: Invalid event index ${index} (events length: ${events.length})`
          );
        }
      },
      [events]
    );

    // Expose the triggerEvent method to parent components
    useImperativeHandle(
      ref,
      () => ({
        triggerEvent,
      }),
      [triggerEvent]
    );

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
            key={`event-${event.index}`}
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

export default React.memo(SeqRing);
