// src/components/WizardContainer.js
import React, { useState } from 'react';

import FileUploadStep from './FileUploadStep';
import FirstNameCheckStep from './FirstNameCheckStep';
import LastNameCheckStep from './LastNameCheckStep';
import DisplayFieldsStep from './DisplayFieldsStep';
import EmailValidityStep from './EmailValidityStep';
import EmailValidityCheck2Step from './EmailValidityCheck2Step';

const WizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // Keep original file data separate from the mutable sheet data.
  const [wizardData, setWizardData] = useState({
    originalFileData: [],     // raw data from the file upload, never changed
    sheetData: [],            // a mutable version if needed
    columnHeaders: [],
    emailColumn: '',
    additionalEmailColumn: '',
    hasSecondaryLastName: false
  });

  const handleExit = () => {
    alert('Exiting wizard...');
    // Additional exit logic can go here.
  };

  return (
    <div className="wizard-container" style={{ padding: '1rem' }}>

      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <FileUploadStep
          onExit={handleExit}
          saveFileData={(file, rowCount, headers, sheetData) => {
            // Store both originalFileData and sheetData for potential usage
            setWizardData({
              ...wizardData,
              originalFileData: sheetData,
              sheetData,
              columnHeaders: headers
            });
            setCurrentStep(2);
          }}
        />
      )}

      {/* Step 2: First Name Check */}
      {currentStep === 2 && (
        <FirstNameCheckStep
          // If you want consistent re-computations from original data:
          sheetData={wizardData.originalFileData}
          columnHeaders={wizardData.columnHeaders}
          onExit={handleExit}
          onBack={() => setCurrentStep(1)}
          onMappingSubmit={(newData) => {
            // Optionally store the result in wizardData.sheetData
            setWizardData({
              ...wizardData,
              sheetData: newData
            });
          }}
          onContinue={() => setCurrentStep(3)}
        />
      )}

      {/* Step 3: Last Name Check */}
      {currentStep === 3 && (
        <LastNameCheckStep
          // Also pass the original data if you want consistent re-computations
          sheetData={wizardData.originalFileData}
          columnHeaders={wizardData.columnHeaders}
          onExit={handleExit}
          onBack={() => setCurrentStep(2)}
          onMappingSubmit={(newData, hasSecondary) => {
            // Store the newly computed data if needed
            setWizardData({
              ...wizardData,
              sheetData: newData,
              hasSecondaryLastName: hasSecondary
            });
          }}
          onContinue={() => setCurrentStep(4)}
        />
      )}

      {/* Step 4: Display Fields Step */}
      {currentStep === 4 && (
        <DisplayFieldsStep
          // If you want consistent re-computations, again use originalFileData
          sheetData={wizardData.originalFileData}
          columnHeaders={wizardData.columnHeaders}
          hasSecondaryLastName={wizardData.hasSecondaryLastName}
          onExit={handleExit}
          onBack={() => setCurrentStep(3)}
          onMappingSubmit={(newData) => {
            setWizardData({
              ...wizardData,
              sheetData: newData
            });
          }}
          onContinue={() => setCurrentStep(5)}
        />
      )}

      {/* Step 5: Email Mapping */}
      {currentStep === 5 && (
        <EmailValidityStep
          columnHeaders={wizardData.columnHeaders}
          onSubmit={(primaryCol, secondaryCol) => {
            setWizardData({
              ...wizardData,
              emailColumn: primaryCol,
              additionalEmailColumn: secondaryCol
            });
            setCurrentStep(6);
          }}
          onBack={() => setCurrentStep(4)}
          onExit={handleExit}
        />
      )}

      {/* Step 6: Email Validity Check 2 */}
      {currentStep === 6 && (
        <EmailValidityCheck2Step
          // If you want to fix invalid emails in the mutable data:
          sheetData={wizardData.sheetData}
          columnHeaders={wizardData.columnHeaders}
          emailColumn={wizardData.emailColumn}
          additionalEmailColumn={wizardData.additionalEmailColumn}
          onExit={handleExit}
          onBack={() => setCurrentStep(5)}
          onContinue={() => setCurrentStep(7)} // or the next step if you have one
        />
      )}

      <p>Current Step: {currentStep}</p>
    </div>
  );
};

export default WizardContainer;
