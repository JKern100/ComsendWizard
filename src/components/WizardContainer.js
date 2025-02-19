// src/components/WizardContainer.js
import React, { useState } from 'react';
import FileUploadStep from './FileUploadStep';
import UploadStatusStep from './UploadStatusStep';
import EmailValidityStep from './EmailValidityStep';
import EmailValidityCheck2Step from './EmailValidityCheck2Step';

const WizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardData, setWizardData] = useState({
    file: null,
    rowCount: null,
    columnHeaders: [],
    sheetData: [],
    emailColumn: 'none',
    additionalEmailColumn: 'none'
  });

  // Save file data from Step 1
  const handleSaveFileData = (file, rowCount, columnHeaders, sheetData) => {
    setWizardData({ ...wizardData, file, rowCount, columnHeaders, sheetData });
  };

  // Handles submission from EmailValidityStep (Step 3)
  const handleEmailSubmit = (emailColumn, additionalEmailColumn) => {
    setWizardData({ ...wizardData, emailColumn, additionalEmailColumn });
    setCurrentStep(4);
  };

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleExit = () => {
    alert('Exiting wizard...');
  };

  return (
    <div>
      {currentStep === 1 && (
        <FileUploadStep
          onNext={handleNext}
          onExit={handleExit}
          saveFileData={handleSaveFileData}
        />
      )}

      {currentStep === 2 && (
        <UploadStatusStep
          fileName={wizardData.file ? wizardData.file.name : ''}
          rowCount={wizardData.rowCount}
          onContinue={() => setCurrentStep(3)}
          onExit={handleExit}
        />
      )}

      {currentStep === 3 && (
        <EmailValidityStep
          columnHeaders={wizardData.columnHeaders}
          onSubmit={handleEmailSubmit}
          onBack={() => setCurrentStep(2)}
          onExit={handleExit}
        />
      )}

      {currentStep === 4 && (
        <EmailValidityCheck2Step
          sheetData={wizardData.sheetData}       // must be an array of arrays
          columnHeaders={wizardData.columnHeaders} // must be an array of strings
          emailColumn={wizardData.emailColumn}   // must be a string
          onFixNow={() => setCurrentStep(5)}
          onExit={handleExit}
        />
      )}




      <p>Current Step: {currentStep}</p>
    </div>
  );
};

export default WizardContainer;
