// src/components/FirstNameCheckStep.js
import React, { useState } from 'react';

const FirstNameCheckStep = ({
  sheetData,           // array of arrays; row 0 is the header
  columnHeaders,       // array of strings from the header row
  onExit,              // wizard-level exit callback
  onWizardBack,        // wizard-level "go to previous step" callback (optional)
  onMappingSubmit,     // callback that returns new sheet data
  onContinue           // wizard-level continue callback
}) => {
  // Local states
  const [mappingChoice, setMappingChoice] = useState('single');
  const [selectedSingleField, setSelectedSingleField] = useState('none');
  const [selectedFirstNameField, setSelectedFirstNameField] = useState('none');
  const [selectedSecondNameField, setSelectedSecondNameField] = useState('none');
  const [submitted, setSubmitted] = useState(false);
  const [newSheetData, setNewSheetData] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sampleResults, setSampleResults] = useState([]);

  // Compute the first name for a given row
  const computeFirstName = (row) => {
    if (mappingChoice === 'single') {
      const idx = columnHeaders.indexOf(selectedSingleField);
      if (idx === -1) return '';
      return (row[idx] || '').trim();
    } else {
      // "double" mapping
      const idx1 = columnHeaders.indexOf(selectedFirstNameField);
      const idx2 = columnHeaders.indexOf(selectedSecondNameField);
      const name1 = idx1 !== -1 ? (row[idx1] || '').trim() : '';
      const name2 = idx2 !== -1 ? (row[idx2] || '').trim() : '';
      if (name1 && name2) return `${name1} and ${name2}`;
      return name1 || name2;
    }
  };

  // Generate new sheet data with a "First Name" column
  const generateNewSheetData = () => {
    if (!sheetData || sheetData.length === 0) return [];
    const copy = JSON.parse(JSON.stringify(sheetData));
    // Ensure "First Name" column exists
    const header = copy[0];
    let firstNameIndex = header.indexOf('First Name');
    if (firstNameIndex === -1) {
      header.push('First Name');
      firstNameIndex = header.length - 1;
    }
    // Fill each row
    for (let i = 1; i < copy.length; i++) {
      const row = copy[i];
      const computed = computeFirstName(row);
      if (row.length <= firstNameIndex) {
        row.push(computed);
      } else {
        row[firstNameIndex] = computed;
      }
    }
    return copy;
  };

  // Convert newSheetData to CSV
  const generateCSVDownloadUrl = (data) => {
    const csvContent = data
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  };

  // Form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate
    if (mappingChoice === 'single') {
      if (selectedSingleField === 'none') {
        alert('Please select a field for First Name mapping.');
        return;
      }
    } else {
      if (
        selectedFirstNameField === 'none' ||
        selectedSecondNameField === 'none'
      ) {
        alert('Please select both fields for Name 1 and Name 2.');
        return;
      }
    }
    // Generate new data
    const newData = generateNewSheetData();
    setNewSheetData(newData);
    // Sample results (first 5 data rows)
    const headerRow = newData[0];
    const fnIndex = headerRow.indexOf('First Name');
    // We'll store row index + result so user sees "Row #2: Jack and Sarah"
    const samples = newData.slice(1, 6).map((row, idx) => ({
      rowNumber: idx + 1, // actual row offset by 1
      value: row[fnIndex] || '',
    }));
    setSampleResults(samples);

    // Generate download link
    const url = generateCSVDownloadUrl(newData);
    setDownloadUrl(url);

    setSubmitted(true);
    if (onMappingSubmit) {
      onMappingSubmit(newData);
    }
  };

  // "Back to editing" on the same step
  const handleLocalBack = () => {
    // revert to not submitted so user can re-map
    setSubmitted(false);
    setNewSheetData([]);
    setDownloadUrl('');
    setSampleResults([]);
  };

  return (
    <div style={{ margin: '1rem' }}>
      {!submitted && (
        <form onSubmit={handleSubmit}>
          <h2>First Name Check</h2>
          <p>
            Every import file must have a First Name and a Last Name field.
            Please confirm which of your fields to choose.
            <br />
            The First Name field in Comsend combines both heads of households.
            Do you have a single field to map to, or do you want to combine two
            separate fields?
          </p>

          <div>
            <input
              type="radio"
              id="single-field"
              name="mappingChoice"
              value="single"
              checked={mappingChoice === 'single'}
              onChange={() => setMappingChoice('single')}
            />
            <label htmlFor="single-field">Single field</label>
            <input
              type="radio"
              id="double-field"
              name="mappingChoice"
              value="double"
              checked={mappingChoice === 'double'}
              onChange={() => setMappingChoice('double')}
              style={{ marginLeft: '1rem' }}
            />
            <label htmlFor="double-field">Two separate fields</label>
          </div>
          <br />

          {mappingChoice === 'single' && (
            <div>
              <label htmlFor="first-name-select">First Name:</label>
              <select
                id="first-name-select"
                value={selectedSingleField}
                onChange={(e) => setSelectedSingleField(e.target.value)}
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
          )}

          {mappingChoice === 'double' && (
            <div style={{ display: 'flex', gap: '2rem' }}>
              <div>
                <label htmlFor="name1-select">Name 1:</label>
                <select
                  id="name1-select"
                  value={selectedFirstNameField}
                  onChange={(e) => setSelectedFirstNameField(e.target.value)}
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
              <div>
                <label htmlFor="name2-select">Name 2:</label>
                <select
                  id="name2-select"
                  value={selectedSecondNameField}
                  onChange={(e) => setSelectedSecondNameField(e.target.value)}
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
            </div>
          )}
          <br />
          <div>
            {/* Wizard-level back (optional). If you want to go back to the prior wizard step */}
            {onWizardBack && (
              <button
                type="button"
                onClick={onWizardBack}
                style={{ marginRight: '1rem' }}
              >
                Back
              </button>
            )}
            <button type="submit" style={{ marginRight: '1rem' }}>
              Submit
            </button>
            <button type="button" onClick={onExit}>
              Exit
            </button>
          </div>
        </form>
      )}

      {submitted && (
        <div>
          <h2>First Name Mapping Result (Sample)</h2>
          {mappingChoice === 'single' ? (
            <p>
              The First Name field will be mapped from:{' '}
              <strong>{selectedSingleField}</strong>
            </p>
          ) : (
            <p>
              The First Name field will be combined from:{' '}
              <strong>{selectedFirstNameField}</strong> and{' '}
              <strong>{selectedSecondNameField}</strong>
            </p>
          )}
          <h3>Sample Results (First 5 Rows):</h3>
          <ul>
            {sampleResults.map((sample, idx) => (
              <li key={idx}>
                Row #{sample.rowNumber}: {sample.value}
              </li>
            ))}
          </ul>

          {downloadUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <a href={downloadUrl} download="fixed_sheet.csv">
                Download Fixed Sheet
              </a>
            </div>
          )}

          {/* The local back button that reverts to editing mode on the same step */}
          <button onClick={handleLocalBack} style={{ marginRight: '1rem' }}>
            Back
          </button>
          <button onClick={onContinue} style={{ marginRight: '1rem' }}>
            Continue
          </button>
          <button onClick={onExit}>Exit</button>
        </div>
      )}
    </div>
  );
};

export default FirstNameCheckStep;
