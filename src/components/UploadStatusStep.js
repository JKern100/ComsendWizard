// src/components/UploadStatusStep.js
import React from 'react';

const UploadStatusStep = ({ fileName, rowCount, onContinue, onExit }) => {
  return (
    <div>
      <h2>Upload Status</h2>
      <p>
        Your file <strong>{fileName}</strong> was successfully staged and contains{' '}
        <strong>{rowCount !== null ? rowCount : 'unknown'}</strong> rows aside from your header row.
        Any changes you make to your file from now on will not be captured in this Wizard unless you
        start over and reupload the file.
      </p>
      <div style={{ marginTop: '1rem' }}>
        <button onClick={onContinue}>Continue</button>
        <button onClick={onExit} style={{ marginLeft: '1rem' }}>
          Exit
        </button>
      </div>
    </div>
  );
};

export default UploadStatusStep;
