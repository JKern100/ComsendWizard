// src/components/FileUploadStep.js
import React, { useState } from 'react';
import * as XLSX from 'xlsx'; // for Excel parsing

const FileUploadStep = ({ onNext, onExit, saveFileData }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [error, setError] = useState('');

  const allowedExtensions = ['csv', 'xls', 'xlsx'];

  const handleFileChange = (e) => {
    setError('');
    if (e.target.files.length > 0) {
      const file = e.target.files[0];
      const extension = file.name.split('.').pop().toLowerCase();
      if (!allowedExtensions.includes(extension)) {
        setError('Please choose only an Excel or CSV type file.');
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('No file selected.');
      return;
    }

    const extension = selectedFile.name.split('.').pop().toLowerCase();
    if (extension === 'xls' || extension === 'xlsx') {
      const reader = new FileReader();
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          // Subtract 1 from total rows for header row
          const rowCount = sheetData.length > 1 ? sheetData.length - 1 : 0;
          // Get column headers from the first row
          const headerRow = sheetData[0] || [];
          const columnHeaders = headerRow.map((col, idx) => col || `Column ${idx + 1}`);

          // Save the file, rowCount, columnHeaders, and the full sheet data
          saveFileData(selectedFile, rowCount, columnHeaders, sheetData);
          onNext();
        } catch (err) {
          setError('Error reading Excel file: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(selectedFile);
    } else if (extension === 'csv') {
      // For CSV, you could parse similarly. For now, set rowCount = 0 and no column headers.
      saveFileData(selectedFile, 0, [], []);
      // onNext();
    } else {
      saveFileData(selectedFile, null, [], []);
      // onNext();np
    }
  };

  return (
    <div>
      <h2>COPY TEST VERSION: Please upload your import file</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="file"
          onChange={handleFileChange}
          accept=".csv, .xls, .xlsx"
        />
        {error && <div style={{ color: 'red' }}>{error}</div>}
        <div style={{ marginTop: '1rem' }}>
          <button type="submit">Submit</button>
          <button type="button" onClick={onExit} style={{ marginLeft: '1rem' }}>
            Exit
          </button>
        </div>
      </form>
    </div>
  );
};

export default FileUploadStep;
