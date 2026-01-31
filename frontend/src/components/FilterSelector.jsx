import React from 'react';

const FilterSelector = ({ label, type, value, onChange, options = [] }) => {
  return (
    <div>
      <label className="block text-gray-300 mb-2 font-medium">
        {label}
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`py-2 px-3 rounded-lg text-center transition-colors ${
              value === option.value 
                ? 'bg-primary-600 text-white' 
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
            onClick={() => onChange(type, option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FilterSelector;
