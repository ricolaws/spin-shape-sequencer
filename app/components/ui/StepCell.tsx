import React, { useRef, useEffect, useState } from "react";

interface StepCellProps {
  index: number;
  value: number;
  x: number;
  width: number;
  height: number;
  isActive?: boolean;
  inCurrentWindow?: boolean;
  minValue?: number;
  maxValue?: number;
  activeStepColor?: string;
  inactiveStepColor?: string;
  cellBGColor?: string;
  onValueChange?: (index: number, newValue: number) => void;
}

const StepCell: React.FC<StepCellProps> = ({
  index,
  value,
  x,
  width,
  height,
  isActive = false,
  inCurrentWindow = false,
  minValue = 48,
  maxValue = 72,
  activeStepColor = "#4080bf",
  inactiveStepColor = "#808080",
  cellBGColor = "#323232",
  onValueChange,
}) => {
  const [liveValue, setLiveValue] = useState(value);
  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const valueRange = maxValue - minValue;
  const valuePercentage = ((liveValue - minValue) / valueRange) * 100;
  const barHeight = `${valuePercentage}%`;
  const barColor = isActive ? activeStepColor : inactiveStepColor;
  const opacity = inCurrentWindow ? 1 : 0.5;
  const latestValue = useRef(value);
  const startValue = useRef(value);
  const startY = useRef(0);
  const isClick = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    isDragging.current = true;
    isClick.current = true;
    startY.current = e.clientY;
    startValue.current = value;

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging.current) return;

    const deltaY = startY.current - e.clientY;

    // If movement exceeds a small threshold, treat as a drag
    if (Math.abs(deltaY) > 3) {
      isClick.current = false;
    }

    if (!isClick.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const height = rect.height;

      // Map movement to value range
      const valueChange = (deltaY / height) * valueRange;
      const newValue = Math.round(
        Math.max(minValue, Math.min(maxValue, startValue.current + valueChange))
      );

      setLiveValue(newValue);
      latestValue.current = newValue;
    }
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    if (isClick.current) {
      // CLICK: Set value directly to clicked position
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        const relativeY = rect.bottom - e.clientY;
        const newValue = Math.round(
          minValue + (relativeY / height) * valueRange
        );
        const clampedValue = Math.max(minValue, Math.min(maxValue, newValue));

        setLiveValue(clampedValue);
        latestValue.current = clampedValue;
      }
    }

    if (onValueChange) {
      onValueChange(index, latestValue.current);
    }

    document.removeEventListener("pointermove", handlePointerMove);
    document.removeEventListener("pointerup", handlePointerUp);
  };

  useEffect(() => {
    return () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      if (animationFrame.current) cancelAnimationFrame(animationFrame.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute flex flex-col justify-end"
      style={{
        left: x,
        bottom: 0,
        width,
        height,
        backgroundColor: cellBGColor,
        borderRadius: "2px",
        opacity,
        cursor: "ns-resize",
        border: "1px solid rgba(255,255,255,0.1)",
        userSelect: "none",
      }}
      onPointerDown={handlePointerDown}
    >
      <div
        className="bar-value"
        style={{
          width: "100%",
          height: barHeight,
          backgroundColor: barColor,
          borderRadius: "2px 2px 0 0",
        }}
      />
    </div>
  );
};

export default StepCell;
