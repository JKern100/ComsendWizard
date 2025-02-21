// src/components/DisplayFieldsStep.js
import React, { useState, useEffect, useRef } from 'react';

const DisplayFieldsStep = ({
  sheetData,            // array of arrays; row 0 is header
  columnHeaders,        // array of strings for dropdowns
  hasSecondaryLastName, // boolean indicating if a secondary last name was provided
  onExit,               // callback to exit wizard
  onBack,               // callback to go back to previous step
  onMappingSubmit,      // callback to store new sheet data
  onContinue            // callback to proceed to next step
}) => {
  // Dropdown states for the four display fields:
  const [firstLetterDesignation, setFirstLetterDesignation] = useState('none');
  const [memberListField, setMemberListField] = useState('none');
  const [finalLetterDesignation, setFinalLetterDesignation] = useState('none');
  const [finalLetterGreeting, setFinalLetterGreeting] = useState('none');

  // Radio state for display style if needed (only shown if hasSecondaryLastName and any field is "none")
  const [displayStyle, setDisplayStyle] = useState('hyphenated'); 
  // Submission states
  const [submitted, setSubmitted] = useState(false);
  const [newSheetData, setNewSheetData] = useState([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [sampleResults, setSampleResults] = useState('');

  // Determine if any display field is "none"
  const anyIsNone =
    [firstLetterDesignation, memberListField, finalLetterDesignation, finalLetterGreeting].some(
      (val) => val === 'none'
    );
  // Show style options if there is a secondary last name and any field is "none"
  const shouldShowDisplayStyle = hasSecondaryLastName && anyIsNone;

  // Store the original sheetData once, so we always compute from the same base.
  const originalSheetDataRef = useRef(sheetData);
  useEffect(() => {
    originalSheetDataRef.current = sheetData;
  }, [sheetData]);

  // Helper: Compute the Display Fields value for a single row.
  // If there's no secondary last name and any field is "none", use the default fallback format.
  const computeDisplayFieldsValue = (row, header) => {
    if (!hasSecondaryLastName && anyIsNone) {
      // Fallback: use the existing "First Name" and "Last Name" columns
      const fnIndex = header.indexOf('First Name');
      const lnIndex = header.indexOf('Last Name');
      if (fnIndex !== -1 && lnIndex !== -1) {
        const firstN = (row[fnIndex] || '').trim();
        const lastN = (row[lnIndex] || '').trim();
        if (firstN && lastN) return `${firstN} & ${lastN}`;
        return firstN || lastN;
      }
      return 'Default Display Name';
    }

    // Otherwise, combine the chosen fields
    const chosen = [];
    const getTrimmedValue = (field) => {
      if (field === 'none') return '';
      const idx = header.indexOf(field);
      if (idx === -1) return '';
      return (row[idx] || '').trim();
    };

    const val1 = getTrimmedValue(firstLetterDesignation);
    if (val1) chosen.push(val1);
    const val2 = getTrimmedValue(memberListField);
    if (val2) chosen.push(val2);
    const val3 = getTrimmedValue(finalLetterDesignation);
    if (val3) chosen.push(val3);
    const val4 = getTrimmedValue(finalLetterGreeting);
    if (val4) chosen.push(val4);

    let combined = chosen.join(', ');

    if (shouldShowDisplayStyle) {
      switch (displayStyle) {
        case 'hyphenated':
          combined = `Hyphenated: ${combined}`;
          break;
        case 'space':
          combined = `Space: ${combined}`;
          break;
        case 'comma':
          combined = `Comma: ${combined}`;
          break;
        case 'individual':
          combined = `Individual: ${combined}`;
          break;
        default:
          break;
      }
    }
    return combined;
  };

  // Helper: Generate new sheet data from the original sheet data.
  // Always start fresh from originalSheetDataRef.current to avoid incremental changes.
  const generateNewSheetData = () => {
    const originalData = originalSheetDataRef.current;
    if (!originalData || originalData.length === 0) return [];
    // Deep copy the original data
    const copy = JSON.parse(JSON.stringify(originalData));
    const header = copy[0];

    // Remove any existing "Display Fields" column
    const existingIndex = header.indexOf('Display Fields');
    if (existingIndex !== -1) {
      header.splice(existingIndex, 1);
      for (let i = 1; i < copy.length; i++) {
        copy[i].splice(existingIndex, 1);
      }
    }
    // Append a fresh "Display Fields" column
    header.push('Display Fields');
    const newDisplayIndex = header.length - 1;

    // Compute the new display value for each row
    for (let i = 1; i < copy.length; i++) {
      const row = copy[i];
      const displayVal = computeDisplayFieldsValue(row, header);
      row[newDisplayIndex] = displayVal;
    }
    return copy;
  };

  // Helper: Generate a CSV download URL from data
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
    const newData = generateNewSheetData();
    setNewSheetData(newData);

    // Compute sample results for first 5 data rows
    const headerRow = newData[0];
    const dfIndex = headerRow.indexOf('Display Fields');
    const samples = newData.slice(1, 6).map((row, idx) => ({
      rowNumber: idx + 1,
      value: row[dfIndex] || ''
    }));
    setSampleResults(samples);

    const url = generateCSVDownloadUrl(newData);
    setDownloadUrl(url);
    setSubmitted(true);
    if (onMappingSubmit) {
      onMappingSubmit(newData);
    }
  };

  // Local back to allow re-editing on this step
  const handleLocalBack = () => {
    setSubmitted(false);
    setNewSheetData([]);
    setDownloadUrl('');
    setSampleResults([]);
  };

  return (
    <div style={{ margin: '1rem' }}>
      {!submitted && (
        <form onSubmit={handleSubmit}>
          <h2>Display Fields Mapping</h2>
          <p>Map the Display Fields you have below, or leave “none”:</p>
          <div style={{ marginBottom: '1rem' }}>
            <label>First Letter Designation: </label>
            <select
              value={firstLetterDesignation}
              onChange={(e) => setFirstLetterDesignation(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="none">none</option>
              {columnHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Member List: </label>
            <select
              value={memberListField}
              onChange={(e) => setMemberListField(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="none">none</option>
              {columnHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Final Letter Designation: </label>
            <select
              value={finalLetterDesignation}
              onChange={(e) => setFinalLetterDesignation(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="none">none</option>
              {columnHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label>Final Letter Greeting: </label>
            <select
              value={finalLetterGreeting}
              onChange={(e) => setFinalLetterGreeting(e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="none">none</option>
              {columnHeaders.map((header) => (
                <option key={header} value={header}>
                  {header}
                </option>
              ))}
            </select>
          </div>

          {/* Show fallback message if no secondary last name and at least one field is "none" */}
          {(!hasSecondaryLastName && anyIsNone) && (
            <div style={{ marginBottom: '1rem', fontStyle: 'italic', color: 'gray' }}>
              No Secondary Last Name provided; defaulting display name to: {`{First Name} & {Last Name}`}
            </div>
          )}

          {/* If secondary last name exists and any field is "none", show display style options */}
          {hasSecondaryLastName && anyIsNone && (
            <div style={{ marginBottom: '1rem' }}>
              <p>
                Since you have a Secondary Last Name and at least one Display Field is "none", choose your default naming format:
              </p>
              <div>
                <label>
                  <input
                    type="radio"
                    name="displayStyle"
                    value="hyphenated"
                    checked={displayStyle === 'hyphenated'}
                    onChange={() => setDisplayStyle('hyphenated')}
                  />
                  Standard Hyphenated
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="radio"
                    name="displayStyle"
                    value="space"
                    checked={displayStyle === 'space'}
                    onChange={() => setDisplayStyle('space')}
                  />
                  Standard with Space
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="radio"
                    name="displayStyle"
                    value="comma"
                    checked={displayStyle === 'comma'}
                    onChange={() => setDisplayStyle('comma')}
                  />
                  Comma Separated Last Name
                </label>
              </div>
              <div>
                <label>
                  <input
                    type="radio"
                    name="displayStyle"
                    value="individual"
                    checked={displayStyle === 'individual'}
                    onChange={() => setDisplayStyle('individual')}
                  />
                  Individual Naming
                </label>
              </div>
            </div>
          )}

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
          <h2>Display Fields Mapping Result (Sample)</h2>
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

export default DisplayFieldsStep;
