import React, { useState, useEffect, useRef } from 'react';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => v.toString(),
}) => {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.min(Number(e.target.value), localValue[1] - step);
    setLocalValue([newVal, localValue[1]]);
    onChange([newVal, localValue[1]]);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = Math.max(Number(e.target.value), localValue[0] + step);
    setLocalValue([localValue[0], newVal]);
    onChange([localValue[0], newVal]);
  };

  const getPercent = (value: number) => Math.round(((value - min) / (max - min)) * 100);

  return (
    <div className="w-full">
      <style>
        {`
          .range-slider-thumb {
            -webkit-appearance: none;
            pointer-events: none;
            width: 100%;
            height: 24px;
            -webkit-tap-highlight-color: transparent;
            z-index: 30;
            position: absolute;
            outline: none;
            cursor: pointer;
            background: transparent;
          }
          .range-slider-thumb::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ec4899;
            cursor: pointer;
            pointer-events: auto;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
          .range-slider-thumb::-moz-range-thumb {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #ec4899;
            cursor: pointer;
            pointer-events: auto;
            border: 2px solid white;
            box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          }
        `}
      </style>
      <div className="relative w-full h-8 mb-6 flex items-center">
        {/* Track Background */}
        <div className="absolute w-full h-2 bg-gray-200 rounded-full"></div>
        
        {/* Active Range Track */}
        <div
          className="absolute h-2 bg-pink-500 rounded-full z-10"
          style={{
            left: `${getPercent(localValue[0])}%`,
            width: `${getPercent(localValue[1]) - getPercent(localValue[0])}%`,
          }}
        />

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[0]}
          onChange={handleMinChange}
          className="range-slider-thumb z-20"
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue[1]}
          onChange={handleMaxChange}
          className="range-slider-thumb z-30"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center border border-gray-200 rounded px-3 py-2 w-full focus-within:ring-2 focus-within:ring-pink-200 focus-within:border-pink-300">
            <span className="text-gray-500 mr-1">R</span>
            <input 
                type="number" 
                min={min}
                max={localValue[1]}
                value={localValue[0]}
                onChange={handleMinChange}
                className="w-full outline-none text-right font-medium"
            />
        </div>
        <span className="text-gray-500">to</span>
        <div className="flex items-center border border-gray-200 rounded px-3 py-2 w-full focus-within:ring-2 focus-within:ring-pink-200 focus-within:border-pink-300">
            <span className="text-gray-500 mr-1">R</span>
            <input 
                type="number" 
                min={localValue[0]}
                max={max}
                value={localValue[1]}
                onChange={handleMaxChange}
                className="w-full outline-none text-right font-medium"
            />
        </div>
      </div>
    </div>
  );
};
