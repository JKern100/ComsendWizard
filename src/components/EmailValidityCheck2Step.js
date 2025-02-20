// src/components/EmailValidityCheck2Step.js
import React, { useState, useEffect, useCallback } from 'react';

const EmailValidityCheck2Step = ({
  sheetData,             // array of arrays; row 0 is the header
  columnHeaders,         // array of strings, e.g. ["Email", "Name", "Age", "AltEmail"]
  emailColumn,           // primary email column name
  additionalEmailColumn, // secondary email column name, or "none"
  onExit,                // callback to exit wizard
  onContinue,            // callback to proceed to next step
  onBack                 // callback to go back to the previous step
}) => {
  // invalidList: each entry => { rowIndex, column, originalEmail, correctedEmail }
  const [invalidList, setInvalidList] = useState([]);
  const [updatedSheetData, setUpdatedSheetData] = useState([]);
  const [allValid, setAllValid] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [reCheckMessage, setReCheckMessage] = useState('');

  /**
   * Validate both columns, ignoring row 0 (header row).
   */
  const validateEmails = useCallback((data) => {
    const tempInvalidList = [];

    const primaryIndex = columnHeaders.indexOf(emailColumn);
    if (primaryIndex === -1) {
      console.warn(`Primary column "${emailColumn}" not found in columnHeaders:`, columnHeaders);
    }

    let additionalIndex = -1;
    if (additionalEmailColumn && additionalEmailColumn.toLowerCase() !== 'none') {
      additionalIndex = columnHeaders.indexOf(additionalEmailColumn);
      if (additionalIndex === -1) {
        console.warn(`Additional column "${additionalEmailColumn}" not found in columnHeaders:`, columnHeaders);
      }
    }

    const localEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    data.forEach((row, idx) => {
      if (idx === 0) return; // skip header row

      // Validate primary email column
      if (primaryIndex !== -1) {
        const rawPrimary = row[primaryIndex] || '';
        const trimmedPrimary = rawPrimary.trim();
        // ignore empty => not invalid
        if (trimmedPrimary && !localEmailRegex.test(trimmedPrimary)) {
          tempInvalidList.push({
            rowIndex: idx,
            column: emailColumn,
            originalEmail: trimmedPrimary,
            correctedEmail: trimmedPrimary
          });
        }
      }

      // Validate additional email column
      if (additionalIndex !== -1) {
        const rawAdditional = row[additionalIndex] || '';
        const trimmedAdditional = rawAdditional.trim();
        if (trimmedAdditional && !localEmailRegex.test(trimmedAdditional)) {
          tempInvalidList.push({
            rowIndex: idx,
            column: additionalEmailColumn,
            originalEmail: trimmedAdditional,
            correctedEmail: trimmedAdditional
          });
        }
      }
    });

    return tempInvalidList;
  }, [columnHeaders, emailColumn, additionalEmailColumn]);

  /**
   * Convert array of arrays to CSV and return a download URL.
   */
  const generateCSVDownloadUrl = useCallback((data) => {
    const csvContent = data
      .map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }, []);

  /**
   * Initial load: copy the sheet data and validate.
   */
  useEffect(() => {
    if (!sheetData || !columnHeaders || !emailColumn) {
      console.warn('sheetData, columnHeaders, or emailColumn is missing');
      return;
    }
    const copy = JSON.parse(JSON.stringify(sheetData));
    setUpdatedSheetData(copy);

    const tempInvalidList = validateEmails(copy);
    setInvalidList(tempInvalidList);
    setAllValid(tempInvalidList.length === 0);
  }, [sheetData, columnHeaders, emailColumn, additionalEmailColumn, validateEmails]);

  /**
   * Merges user-corrected addresses into updatedSheetData, then re-validates.
   */
  const handleReCheck = () => {
    if (!updatedSheetData) return;

    const primaryIndex = columnHeaders.indexOf(emailColumn);
    let additionalIndex = -1;
    if (additionalEmailColumn && additionalEmailColumn.toLowerCase() !== 'none') {
      additionalIndex = columnHeaders.indexOf(additionalEmailColumn);
    }

    // Merge corrected emails
    const newData = updatedSheetData.map((row, idx) => {
      if (idx === 0) return row; // skip header
      const rowEntries = invalidList.filter((item) => item.rowIndex === idx);
      if (rowEntries.length > 0) {
        const newRow = [...row];
        rowEntries.forEach((entry) => {
          if (entry.column === emailColumn && primaryIndex !== -1) {
            newRow[primaryIndex] = entry.correctedEmail.trim();
          }
          if (entry.column === additionalEmailColumn && additionalIndex !== -1) {
            newRow[additionalIndex] = entry.correctedEmail.trim();
          }
        });
        return newRow;
      }
      return row;
    });
    setUpdatedSheetData(newData);

    // Re-validate
    const newInvalidList = validateEmails(newData);
    setInvalidList(newInvalidList);

    if (newInvalidList.length === 0) {
      setAllValid(true);
      setReCheckMessage('All addresses are now valid! You can download the fixed sheet or continue.');
      const url = generateCSVDownloadUrl(newData);
      setDownloadUrl(url);
    } else {
      setAllValid(false);
      setReCheckMessage(
        `There are still ${newInvalidList.length} invalid email entries. Please fix them and re-check.`
      );
      setDownloadUrl('');
    }
  };

  // Handle user editing an invalid email in the UI
  const handleEmailChange = (rowIndex, column, newValue) => {
    setInvalidList((prevList) =>
      prevList.map((item) =>
        item.rowIndex === rowIndex && item.column === column
          ? { ...item, correctedEmail: newValue }
          : item
      )
    );
  };

  // Separate invalid items for the two columns
  const primaryInvalid = invalidList.filter(item => item.column === emailColumn);
  const secondaryInvalid = invalidList.filter(item => item.column === additionalEmailColumn);

  return (
    <div style={{ margin: '1rem' }}>
      <h2>Email Validity Check 2</h2>
      <p>
        We’ve identified invalid emails in your file (excluding the header row). Edit them below,
        then click <strong>Re-check</strong>. When all addresses become valid, you can download
        the fixed sheet or continue.
      </p>

      <p>
        Currently, there are {invalidList.length} invalid email address
        {invalidList.length === 1 ? '' : 'es'}.
      </p>

      {reCheckMessage && (
        <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
          {reCheckMessage}
        </div>
      )}

      {invalidList.length > 0 && (
        <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3>{emailColumn} (Primary)</h3>
            {primaryInvalid.length > 0 ? (
              primaryInvalid.map((item) => (
                <div key={`${item.rowIndex}-${item.column}`} style={{ marginBottom: '0.5rem' }}>
                  <span>Row #{item.rowIndex}:</span>
                  <input
                    type="text"
                    value={item.correctedEmail}
                    onChange={(e) => handleEmailChange(item.rowIndex, item.column, e.target.value)}
                    style={{ marginLeft: '0.5rem' }}
                  />
                </div>
              ))
            ) : (
              <p>All valid!</p>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3>{additionalEmailColumn} (Secondary)</h3>
            {secondaryInvalid.length > 0 ? (
              secondaryInvalid.map((item) => (
                <div key={`${item.rowIndex}-${item.column}`} style={{ marginBottom: '0.5rem' }}>
                  <span>Row #{item.rowIndex}:</span>
                  <input
                    type="text"
                    value={item.correctedEmail}
                    onChange={(e) => handleEmailChange(item.rowIndex, item.column, e.target.value)}
                    style={{ marginLeft: '0.5rem' }}
                  />
                </div>
              ))
            ) : (
              <p>All valid!</p>
            )}
          </div>
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        {/* The new "Back" button */}
        {onBack && (
          <button onClick={onBack} style={{ marginRight: '1rem' }}>
            Back
          </button>
        )}

        <button onClick={onExit} style={{ marginRight: '1rem' }}>
          Exit
        </button>
        {/* Show Re-check button only if invalidList > 0 */}
        {invalidList.length > 0 && (
          <button onClick={handleReCheck} style={{ marginRight: '1rem' }}>
            Re-check
          </button>
        )}
        <button onClick={onContinue} disabled={!allValid}>
          Continue
        </button>
      </div>

      {allValid && downloadUrl && (
        <div style={{ marginTop: '1rem' }}>
          <a href={downloadUrl} download="fixed_sheet.csv">
            Download Fixed Sheet
          </a>
        </div>
      )}
    </div>
  );
};

export default EmailValidityCheck2Step;
