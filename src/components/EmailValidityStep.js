// src/components/EmailValidityStep.js
import React, { useState } from 'react';

const EmailValidityStep = ({ columnHeaders, onSubmit, onBack, onExit }) => {
  const [emailColumn, setEmailColumn] = useState('none');
  const [additionalEmailColumn, setAdditionalEmailColumn] = useState('none');

  const handleSubmit = (e) => {
    e.preventDefault();
    // You could add further validation here if needed
    onSubmit(emailColumn, additionalEmailColumn);
  };

  return (
    <div>
      <h2>Email Validity check</h2>
      <p>
        You can have up to two email addresses associated with a member family. Indicate which of your columns are the member email addresses.
      </p>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label>Email:&nbsp;</label>
          <select
            value={emailColumn}
            onChange={(e) => setEmailColumn(e.target.value)}
          >
            <option value="none">none</option>
            {columnHeaders.map((header, idx) => (
              <option key={idx} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label>Additional Email:&nbsp;</label>
          <select
            value={additionalEmailColumn}
            onChange={(e) => setAdditionalEmailColumn(e.target.value)}
          >
            <option value="none">none</option>
            {columnHeaders.map((header, idx) => (
              <option key={idx} value={header}>
                {header}
              </option>
            ))}
          </select>
        </div>
        <button type="submit">Submit</button>
        <button type="button" onClick={onBack} style={{ marginLeft: '1rem' }}>
          Back
        </button>
        <button type="button" onClick={onExit} style={{ marginLeft: '1rem' }}>
          Exit
        </button>
      </form>
    </div>
  );
};

export default EmailValidityStep;
