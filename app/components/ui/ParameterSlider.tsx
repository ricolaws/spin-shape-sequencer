import { Parameter } from "../audio/types";

interface ParameterSliderProps {
  param: Parameter;
  onChange: (paramId: string, value: number) => void;
}

const ParameterSlider: React.FC<ParameterSliderProps> = ({
  param,
  onChange,
}) => {
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
        defaultValue={param.value}
        onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
        className="w-full accent-blue-500 h-2 rounded-lg appearance-none bg-gray-700"
      />
      <input
        type="number"
        value={param.value}
        onChange={(e) => onChange(param.id, parseFloat(e.target.value))}
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
