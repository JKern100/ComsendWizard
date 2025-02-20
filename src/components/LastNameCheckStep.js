// src/components/LastNameCheckStep.js
import React, { useState } from 'react';

const LastNameCheckStep = ({
  sheetData,         // array of arrays; row 0 is header
  columnHeaders,     // array of strings, e.g. ["Email", "LastName", "SecondaryLastName", ...]
  onExit,            // callback to exit the wizard
  onBack,            // callback to go back to the previous step
  onMappingSubmit,   // callback to pass new sheet data with computed Last Name column
  onContinue         // callback to proceed to the next step
}) => {
  // Local state for dropdown selections
  const [selectedLastNameField, setSelectedLastNameField] = useState('none');
  const [selectedSecondaryLastNameField, setSelectedSecondaryLastNameField] = useState('none');
  // State to track whether the mapping has been submitted
  const [submitted, setSubmitted] = useState(false);
  // New sheet data with computed "Last Name" column
  const [newSheetData, setNewSheetData] = useState([]);
  // CSV download URL for the updated sheet
  const [downloadUrl, setDownloadUrl] = useState('');
  // Sample results for first 5 data rows
  const [sampleResults, setSampleResults] = useState([]);

  // Compute the Last Name value for a given row
  const computeLastName = (row) => {
    const primaryIdx = columnHeaders.indexOf(selectedLastNameField);
    const secondaryIdx = columnHeaders.indexOf(selectedSecondaryLastNameField);
    const primaryName = primaryIdx !== -1 ? (row[primaryIdx] || '').trim() : '';
    const secondaryName = secondaryIdx !== -1 ? (row[secondaryIdx] || '').trim() : '';
    // If both are provided and non-empty, combine them with " and "
    if (selectedSecondaryLastNameField !== 'none') {
      if (primaryName && secondaryName) {
        return `${primaryName} and ${secondaryName}`;
      }
      // If only one exists, return the one that exists
      return primaryName || secondaryName;
    }
    // Otherwise, use the primary field only
    return primaryName;
  };

  // Generate a new sheet data copy with a "Last Name" column added/updated
  const generateNewSheetData = () => {
    if (!sheetData || sheetData.length === 0) return [];
    // Deep copy of sheetData
    const copy = JSON.parse(JSON.stringify(sheetData));
    // Process header row (row 0)
    const header = copy[0];
    let lastNameIndex = header.indexOf('Last Name');
    if (lastNameIndex === -1) {
      header.push('Last Name');
      lastNameIndex = header.length - 1;
    }
    // For each data row, compute the Last Name
    for (let i = 1; i < copy.length; i++) {
      const row = copy[i];
      const computedLastName = computeLastName(row);
      if (row.length <= lastNameIndex) {
        row.push(computedLastName);
      } else {
        row[lastNameIndex] = computedLastName;
      }
    }
    return copy;
  };

  // Generate a CSV download URL from the sheet data
  const generateCSVDownloadUrl = (data) => {
    const csvContent = data
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    // Validate that a primary Last Name field is chosen
    if (selectedLastNameField === 'none') {
      alert('Please select a field for Last Name mapping.');
      return;
    }
    // Generate new sheet data with computed "Last Name" column
    const newData = generateNewSheetData();
    setNewSheetData(newData);
    // Compute sample results for first 5 data rows
    const headerRow = newData[0];
    const lastNameIdx = headerRow.indexOf('Last Name');
    const samples = newData.slice(1, 6).map((row, idx) => ({
      rowNumber: idx + 1,
      value: row[lastNameIdx] || ''
    }));
    setSampleResults(samples);
    // Generate CSV download URL
    const url = generateCSVDownloadUrl(newData);
    setDownloadUrl(url);
    setSubmitted(true);
    // Pass the updated sheet to the parent if needed
    if (onMappingSubmit) {
      onMappingSubmit(newData);
    }
  };

  return (
    <div style={{ margin: '1rem' }}>
      {!submitted && (
        <form onSubmit={handleSubmit}>
          <h2>Last Name Check</h2>
          <p>
            Map the Last Name, and Secondary Last Name (if you have one):
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="last-name-select">Last Name:</label>
            <select
              id="last-name-select"
              value={selectedLastNameField}
              onChange={(e) => setSelectedLastNameField(e.target.value)}
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
          <div style={{ marginBottom: '1rem' }}>
            <label htmlFor="secondary-last-name-select">Secondary Last Name:</label>
            <select
              id="secondary-last-name-select"
              value={selectedSecondaryLastNameField}
              onChange={(e) => setSelectedSecondaryLastNameField(e.target.value)}
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
          <div>
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
          <h2>Last Name Mapping Result (Sample)</h2>
          <p>
            The Last Name field will be mapped from:{' '}
            <strong>{selectedLastNameField}</strong>
            {selectedSecondaryLastNameField !== 'none' && (
              <>
                {' '}
                and <strong>{selectedSecondaryLastNameField}</strong>
              </>
            )}
          </p>
          <h3>Sample Results (First 5 Rows):</h3>
          <ul>
            {sampleResults.map((sample, idx) => (
              <li key={idx}>
                Row #{sample.rowNumber}: {sample.value}
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem' }}>
            {downloadUrl && (
              <a href={downloadUrl} download="fixed_sheet.csv" style={{ marginRight: '1rem' }}>
                Download Fixed Sheet
              </a>
            )}
            <button onClick={onBack} style={{ marginRight: '1rem' }}>
              Back
            </button>
            <button onClick={onContinue} style={{ marginRight: '1rem' }}>
              Continue
            </button>
            <button onClick={onExit}>Exit</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LastNameCheckStep;
