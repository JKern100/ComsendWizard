// src/components/EmailValidityCheck2Step.js
import React, { useState, useEffect } from 'react';

const EmailValidityCheck2Step = ({
  sheetData,      // array of arrays, row 0 is header
  columnHeaders,  // array of strings, e.g. ["Email", "Name", "Age"]
  emailColumn,    // user-chosen column name
  onExit,         // callback: exit wizard
  onContinue      // callback: proceed to next step
}) => {
  // List of invalid addresses => { rowIndex, originalEmail, correctedEmail }
  const [invalidList, setInvalidList] = useState([]);
  // Local copy of the sheet for in-memory updates
  const [updatedSheetData, setUpdatedSheetData] = useState([]);
  // Whether all addresses are valid
  const [allValid, setAllValid] = useState(false);
  // Download URL for the updated CSV
  const [downloadUrl, setDownloadUrl] = useState('');
  // A message to show after re-check attempts
  const [reCheckMessage, setReCheckMessage] = useState('');

  // Validate function: returns an array of invalid items
  const validateEmails = (data) => {
    const emailIndex = columnHeaders.indexOf(emailColumn);
    if (emailIndex === -1) {
      console.warn(`Column "${emailColumn}" not found in columnHeaders:`, columnHeaders);
      return [];
    }
    const localEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const tempInvalidList = [];

    data.forEach((row, idx) => {
      if (idx === 0) return; // skip header
      const rawEmail = row[emailIndex] || '';
      const trimmedEmail = rawEmail.trim();

      // ignore empty => not invalid
      if (!trimmedEmail) return;

      if (!localEmailRegex.test(trimmedEmail)) {
        tempInvalidList.push({
          rowIndex: idx,
          originalEmail: trimmedEmail,
          correctedEmail: trimmedEmail
        });
      }
    });
    return tempInvalidList;
  };

  // Convert updatedSheetData to CSV for download
  const generateCSVDownloadUrl = (data) => {
    const csvContent = data
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(',')
      )
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  };

  // Initial load: copy sheetData, validate once
  useEffect(() => {
    if (!sheetData || !columnHeaders || !emailColumn) {
      console.warn('sheetData, columnHeaders, or emailColumn is missing');
      return;
    }

    // deep copy
    const copy = JSON.parse(JSON.stringify(sheetData));
    setUpdatedSheetData(copy);

    // validate
    const tempInvalidList = validateEmails(copy);
    setInvalidList(tempInvalidList);
    setAllValid(tempInvalidList.length === 0);
  }, [sheetData, columnHeaders, emailColumn]);

  // handle user typing in an invalid row
  const handleEmailChange = (rowIndex, newValue) => {
    setInvalidList((prevList) =>
      prevList.map((item) =>
        item.rowIndex === rowIndex
          ? { ...item, correctedEmail: newValue }
          : item
      )
    );
  };

  // "Re-check" merges corrected addresses + re-validates
  const handleReCheck = () => {
    if (!updatedSheetData) return;

    // 1) Merge user-corrected addresses into updatedSheetData
    const emailIndex = columnHeaders.indexOf(emailColumn);
    const newData = updatedSheetData.map((row, idx) => {
      if (idx === 0) return row; // skip header
      const foundItem = invalidList.find((item) => item.rowIndex === idx);
      if (foundItem) {
        const newRow = [...row];
        newRow[emailIndex] = foundItem.correctedEmail.trim();
        return newRow;
      }
      return row;
    });

    setUpdatedSheetData(newData);

    // 2) Re-validate
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
        `There are still ${newInvalidList.length} invalid addresses. Please fix them and re-check.`
      );
      setDownloadUrl('');
    }
  };

  return (
    <div style={{ margin: '1rem' }}>
      <h2>Email Validity Check 2</h2>
      <p>
        We’ve identified invalid emails in your file (skipping the header row). Edit them below,
        then click <strong>Re-check</strong>. If all addresses become valid, you can download
        the fixed sheet or continue.
      </p>

      <p>
        Currently, you have {invalidList.length} invalid email address
        {invalidList.length === 1 ? '' : 'es'}.
      </p>

      {reCheckMessage && (
        <div style={{ marginBottom: '1rem', fontWeight: 'bold' }}>
          {reCheckMessage}
        </div>
      )}

      {invalidList.length > 0 && (
        <div style={{ marginTop: '1rem' }}>
          <h3>Invalid Emails (editable):</h3>
          {invalidList.map((item) => (
            <div key={item.rowIndex} style={{ marginBottom: '0.5rem' }}>
              <span>Row #{item.rowIndex}:</span>
              <input
                type="text"
                value={item.correctedEmail}
                onChange={(e) => handleEmailChange(item.rowIndex, e.target.value)}
                style={{ marginLeft: '0.5rem' }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Buttons */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onExit} style={{ marginRight: '1rem' }}>
          Exit
        </button>
        <button onClick={handleReCheck} style={{ marginRight: '1rem' }}>
          Re-check
        </button>
        <button onClick={onContinue} disabled={!allValid}>
          Continue
        </button>
      </div>

      {/* If all valid => show link */}
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
