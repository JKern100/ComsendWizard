// src/components/EmailValidityStep.js
import React, { useState } from 'react';

const EmailValidityStep = ({
  columnHeaders,       // array of strings, e.g. ["Email", "Name", "Age", ...]
  onSubmit,            // function to call when user picks columns (primary, additional)
  onBack,              // function to go back to previous step
  onExit               // function to exit the wizard
}) => {
  // Local state for user selections
  const [selectedEmailColumn, setSelectedEmailColumn] = useState('none');
  const [selectedAdditionalEmailColumn, setSelectedAdditionalEmailColumn] = useState('none');

  // Handle form submission
  const handleFormSubmit = (e) => {
    e.preventDefault();
    // Pass the chosen columns to the parent
    onSubmit(selectedEmailColumn, selectedAdditionalEmailColumn);
  };

  return (
    <div style={{ margin: '1rem' }}>
      <h2>Map Email Columns</h2>
      <p>
        Select the columns that contain your primary and (optionally) additional email addresses.
      </p>
      <form onSubmit={handleFormSubmit}>
        {/* Primary Email Column */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="primary-email-select">Primary Email Column: </label>
          <select
            id="primary-email-select"
            value={selectedEmailColumn}
            onChange={(e) => setSelectedEmailColumn(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="none">-- Select Column --</option>
            {columnHeaders.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>

        {/* Additional Email Column */}
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="additional-email-select">Additional Email Column: </label>
          <select
            id="additional-email-select"
            value={selectedAdditionalEmailColumn}
            onChange={(e) => setSelectedAdditionalEmailColumn(e.target.value)}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="none">-- None --</option>
            {columnHeaders.map((header) => (
              <option key={header} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>

        {/* Wizard Controls */}
        <div>
          <button type="submit" style={{ marginRight: '1rem' }}>
            Submit
          </button>
          <button type="button" onClick={onBack} style={{ marginRight: '1rem' }}>
            Back
          </button>
          <button type="button" onClick={onExit}>
            Exit
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailValidityStep;
