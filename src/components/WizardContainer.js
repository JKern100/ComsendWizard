// src/components/WizardContainer.js
import React, { useState } from 'react';

// Import your step components:
import FileUploadStep from './FileUploadStep';
import EmailValidityStep from './EmailValidityStep';
import EmailValidityCheck2Step from './EmailValidityCheck2Step';
import FirstNameCheckStep from './FirstNameCheckStep';
import LastNameCheckStep from './LastNameCheckStep';

const WizardContainer = () => {
  const [currentStep, setCurrentStep] = useState(1);

  // The wizardData object holds all relevant data across steps
  const [wizardData, setWizardData] = useState({
    sheetData: [],
    columnHeaders: [],
    emailColumn: '',
    additionalEmailColumn: '',
    // You can add more fields if needed
  });

  const handleExit = () => {
    alert('Exiting wizard...');
    // Additional exit logic, e.g. reset state or navigate away
  };

  return (
    <div className="wizard-container" style={{ padding: '1rem' }}>
      {/* Step 1: File Upload */}
      {currentStep === 1 && (
        <FileUploadStep
          onExit={handleExit}
          saveFileData={(file, rowCount, headers, sheetData) => {
            // Called when user successfully uploads & parses the file
            // We store the parsed sheetData and columnHeaders in wizardData
            setWizardData({
              ...wizardData,
              sheetData: sheetData,
              columnHeaders: headers
            });
            // Move to next step
            setCurrentStep(2);
          }}
        />
      )}

      {/* Step 2: Email Mapping */}
      {currentStep === 2 && (
        <EmailValidityStep
          columnHeaders={wizardData.columnHeaders}
          onSubmit={(primaryCol, secondaryCol) => {
            // The user picks which columns correspond to the email fields
            setWizardData({
              ...wizardData,
              emailColumn: primaryCol,
              additionalEmailColumn: secondaryCol
            });
            setCurrentStep(3);
          }}
          onBack={() => setCurrentStep(1)}
          onExit={handleExit}
        />
      )}

      {/* Step 3: Email Validity Check 2 */}
      {currentStep === 3 && (
        <EmailValidityCheck2Step
          sheetData={wizardData.sheetData}
          columnHeaders={wizardData.columnHeaders}
          emailColumn={wizardData.emailColumn}
          additionalEmailColumn={wizardData.additionalEmailColumn}
          onExit={handleExit}
          onBack={() => setCurrentStep(2)}
          onContinue={() => setCurrentStep(4)}
        />
      )}

      {/* Step 4: First Name Check */}
      {currentStep === 4 && (
        <FirstNameCheckStep
          sheetData={wizardData.sheetData}
          columnHeaders={wizardData.columnHeaders}
          onExit={handleExit}
          // If you want the user to go back to step 3
          onBack={() => setCurrentStep(3)}
          // When user submits the first name mapping, update sheetData in wizardData
          onMappingSubmit={(newData) => {
            setWizardData({ ...wizardData, sheetData: newData });
            // Do not jump automatically to step 5 here if you want them to see the sample results
            // But if you do want to jump automatically, you can do so:
            // setCurrentStep(5);
          }}
          onContinue={() => setCurrentStep(5)}
        />
      )}

      {/* Step 5: Last Name Check */}
      {currentStep === 5 && (
        <LastNameCheckStep
          sheetData={wizardData.sheetData}
          columnHeaders={wizardData.columnHeaders}
          onExit={handleExit}
          // If you want them to go back to step 4
          onBack={() => setCurrentStep(4)}
          onMappingSubmit={(newData) => {
            // Store the new sheet data with "Last Name" column computed
            setWizardData({ ...wizardData, sheetData: newData });
            // Again, do not automatically jump if you want them to see the sample
            // setCurrentStep(6);
          }}
          onContinue={() => setCurrentStep(6)}
        />
      )}

      {/* Additional steps could be added for step 6, 7, etc. */}
      <p>Current Step: {currentStep}</p>
    </div>
  );
};

export default WizardContainer;
