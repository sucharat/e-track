import React from "react";

const SelectionDropdown = ({ options, value, onChange, label }) => {
  return (
    <div className="selection-dropdown">
      <label>{label}:</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default SelectionDropdown;