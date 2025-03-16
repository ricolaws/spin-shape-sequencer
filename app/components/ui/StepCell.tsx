import React, { useRef, useEffect } from "react";

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
  // Use refs to track internal state without triggers re-renders
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startValue = useRef(0);
  const currentValue = useRef(value);

  // Calculate the value's position in the cell (percentage from bottom)
  const valueRange = maxValue - minValue;
  const valuePercentage = ((value - minValue) / valueRange) * 100;
  const barHeight = `${valuePercentage}%`;

  // Determine the color based on active state
  const barColor = isActive ? activeStepColor : inactiveStepColor;

  // Create transparent overlay when not in current window
  const opacity = inCurrentWindow ? 1 : 0.5;

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    isDragging.current = true;
    startY.current = e.clientY;
    startValue.current = value;
    currentValue.current = value;

    console.log(`StepCell ${index} mousedown: Y=${e.clientY}`);

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    // Log Y position
    console.log(`StepCell ${index} mousemove: Y=${e.clientY}`);

    // Calculate value change
    const deltaY = startY.current - e.clientY;
    const pixelsPerStep = 3;
    const valueChange = Math.round(deltaY / pixelsPerStep);
    currentValue.current = Math.max(
      minValue,
      Math.min(maxValue, startValue.current + valueChange)
    );
  };

  const handleMouseUp = (e: MouseEvent) => {
    if (!isDragging.current) return;

    console.log(`StepCell ${index} mouseup: Y=${e.clientY}`);

    // Only trigger the change if value is different
    if (currentValue.current !== value && onValueChange) {
      console.log(
        `StepCell ${index} value change: ${value} -> ${currentValue.current}`
      );
      onValueChange(index, currentValue.current);
    }

    isDragging.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div
      className="absolute flex flex-col justify-end"
      style={{
        left: x,
        bottom: 0,
        width: width,
        height: height,
        backgroundColor: cellBGColor,
        borderRadius: "2px",
        opacity: opacity,
        cursor: "ns-resize",
        border: "1px solid rgba(255,255,255,0.1)",
        userSelect: "none",
      }}
      onMouseDown={handleMouseDown}
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
