import React, { useState } from "react";
import { Parameter } from "../audio/types";

interface ParameterSliderProps {
  param: Parameter;
  onChange: (paramId: string, value: number) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  param,
  onChange,
}) => {
  const [inputValue, setInputValue] = useState<string>(param.value.toString());

  // Handle slider changes
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value)) {
      onChange(param.id, value);
      setInputValue(value.toString());
    }
  };

  // Handle number input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;

    setInputValue(rawValue);

    const value = parseFloat(rawValue);
    if (!isNaN(value)) {
      onChange(param.id, value);
    }
  };

  // Handle blur event to reset the input to a valid value if needed
  const handleInputBlur = () => {
    const value = parseFloat(inputValue);
    if (isNaN(value)) {
      setInputValue(param.value.toString());
    } else {
      const boundedValue = Math.min(Math.max(value, param.min), param.max);
      setInputValue(boundedValue.toString());
      if (boundedValue !== value) {
        onChange(param.id, boundedValue);
      }
    }
  };

  return (
    <div className="grid grid-cols-[1fr_2fr_auto] gap-2 items-center">
      <label className="text-sm">{param.name}: </label>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={
          param.steps > 1 ? (param.max - param.min) / (param.steps - 1) : 0.001
        }
        value={
          isNaN(parseFloat(inputValue)) ? param.value : parseFloat(inputValue)
        }
        onChange={handleSliderChange}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none bg-gray-700"
      />
      <input
        type="number"
        value={inputValue}
        onChange={handleInputChange}
        onBlur={handleInputBlur}
        min={param.min}
        max={param.max}
        step={
          param.steps > 1 ? (param.max - param.min) / (param.steps - 1) : 0.001
        }
        className="w-16 px-2 py-1 border rounded bg-gray-700 border-gray-600 text-white text-sm"
      />
    </div>
  );
};

export default ParameterSlider;
