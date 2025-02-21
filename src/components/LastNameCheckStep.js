// src/components/LastNameCheckStep.js
import React, { useState, useEffect, useRef } from 'react';

const LastNameCheckStep = ({
  sheetData,          // array of arrays; row 0 is the header row
  columnHeaders,      // array of strings, e.g. ["Last Name", "Primary Name", "Secondary's First", ...]
  onExit,             // callback to exit the wizard
  onBack,             // callback to go back to the previous step
  onMappingSubmit,    // callback to pass new sheet data and a boolean for secondary last name
  onContinue          // callback to proceed to the next step
}) => {
  const [selectedLastNameField, setSelectedLastNameField] = useState('none');
  const [selectedSecondaryLastNameField, setSelectedSecondaryLastNameField] = useState('none');

  const [submitted, setSubmitted] = useState(false);
  const [newSheetData, setNewSheetData] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sampleResults, setSampleResults] = useState([]);

  // We'll store the original sheet data once, ignoring future changes to sheetData.
  const originalSheetDataRef = useRef([]);
  useEffect(() => {
    if (!originalSheetDataRef.current.length) {
      console.log("LastNameCheckStep mount => storing original data");
      originalSheetDataRef.current = sheetData;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Debug helper to see which fields are selected for last name.
   */
  useEffect(() => {
    console.log("Selected fields =>", {
      selectedLastNameField,
      selectedSecondaryLastNameField
    });
  }, [selectedLastNameField, selectedSecondaryLastNameField]);

  /**
   * Compute the mapped Last Name for a given row.
   * If a secondary field is provided (not "none"), combine them with " and ".
   */
  const computeLastName = (row, header) => {
    // Debug logs for each row
    console.log("computeLastName => row:", row);
    console.log("  selectedLastNameField =>", selectedLastNameField, 
                "  selectedSecondaryLastNameField =>", selectedSecondaryLastNameField);

    const primaryIdx = header.indexOf(selectedLastNameField);
    const secondaryIdx = header.indexOf(selectedSecondaryLastNameField);

    console.log("  primaryIdx =>", primaryIdx, "  secondaryIdx =>", secondaryIdx);

    const primary = primaryIdx !== -1 ? (row[primaryIdx] || '').trim() : '';
    const secondary = secondaryIdx !== -1 ? (row[secondaryIdx] || '').trim() : '';

    console.log("  primary =>", primary, "  secondary =>", secondary);

    if (selectedSecondaryLastNameField !== 'none') {
      if (primary && secondary) {
        return `${primary} and ${secondary}`;
      }
      return primary || secondary;
    }
    return primary;
  };

  /**
   * Generate a new sheet from the original data by removing any existing
   * "Wizard Mapped Last Name" column and appending a fresh one. Then fix row lengths.
   */
  const generateNewSheetData = () => {
    const originalData = originalSheetDataRef.current;
    console.log("generateNewSheetData => originalData =>", originalData);

    if (!originalData || originalData.length === 0) {
      console.log("No original data, returning empty");
      return [];
    }

    // Deep copy the original data
    const copy = JSON.parse(JSON.stringify(originalData));
    const header = copy[0];

    console.log("Header before removing wizard col =>", header);

    // Remove any existing "Wizard Mapped Last Name" column
    const existingIndex = header.indexOf('Wizard Mapped Last Name');
    console.log("Removing wizard col => existingIndex:", existingIndex);

    if (existingIndex !== -1) {
      header.splice(existingIndex, 1);
      for (let i = 1; i < copy.length; i++) {
        copy[i].splice(existingIndex, 1);
      }
    }

    console.log("Header after removing =>", header);

    // Append the new computed column
    header.push('Wizard Mapped Last Name');
    const newIndex = header.length - 1;
    console.log("Appending 'Wizard Mapped Last Name' at index =>", newIndex);

    // Force each row to match the header length
    const expectedColumns = header.length;
    for (let i = 1; i < copy.length; i++) {
      while (copy[i].length < expectedColumns) {
        copy[i].push("");
      }
      while (copy[i].length > expectedColumns) {
        copy[i].pop();
      }
    }

    // Now compute and set the new last name value for each row
    for (let i = 1; i < copy.length; i++) {
      const row = copy[i];
      console.log(`Row i => ${i}, row =>`, row);
      const computed = computeLastName(row, header);
      console.log("  computed =>", computed);
      row[newIndex] = computed;
    }

    console.log("Finished generateNewSheetData =>", copy);
    return copy;
  };

  // Generate a CSV download URL from data
  const generateCSVDownloadUrl = (data) => {
    const csvContent = data
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedLastNameField === 'none') {
      alert('Please select a field for Last Name mapping.');
      return;
    }

    console.log("handleSubmit => generating new sheet data...");
    const newData = generateNewSheetData();

    console.log("handleSubmit => newData after mapping =>", newData);

    setNewSheetData(newData);

    // Compute sample results from the new "Wizard Mapped Last Name" column
    if (newData && newData.length > 1) {
      const headerRow = newData[0];
      const lnIndex = headerRow.indexOf('Wizard Mapped Last Name');
      console.log("lnIndex =>", lnIndex);

      const samples = newData.slice(1, 6).map((row, idx) => ({
        rowNumber: idx + 1,
        value: row[lnIndex] || ''
      }));
      console.log("sampleResults =>", samples);
      setSampleResults(samples);

      // Generate CSV download URL
      const url = generateCSVDownloadUrl(newData);
      setDownloadUrl(url);
    } else {
      setSampleResults([]);
      setDownloadUrl('');
    }

    setSubmitted(true);

    // Determine if a secondary field was actually mapped
    const hasSecondary = selectedSecondaryLastNameField !== 'none';
    console.log("hasSecondary =>", hasSecondary);
    if (onMappingSubmit) {
      onMappingSubmit(newData, hasSecondary);
    }
  };

  const handleLocalBack = () => {
    console.log("handleLocalBack => reverting to not submitted");
    setSubmitted(false);
    setNewSheetData([]);
    setDownloadUrl('');
    setSampleResults([]);
  };

  return (
    <div style={{ margin: '1rem' }}>
      {!submitted && (
        <form onSubmit={handleSubmit}>
          <h2>Last Name Check</h2>
          <p>Map the Last Name, and Secondary Last Name (if you have one):</p>

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
            {onBack && (
              <button type="button" onClick={onBack} style={{ marginRight: '1rem' }}>
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
          <h2>Last Name Mapping Result (Sample)</h2>
          <p>
            The Last Name field will be mapped from: <strong>{selectedLastNameField}</strong>
            {selectedSecondaryLastNameField !== 'none' && (
              <> and <strong>{selectedSecondaryLastNameField}</strong></>
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
          {downloadUrl && (
            <div style={{ marginBottom: '1rem' }}>
              <a href={downloadUrl} download="fixed_sheet.csv">
                Download Fixed Sheet
              </a>
            </div>
          )}
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

export default LastNameCheckStep;
