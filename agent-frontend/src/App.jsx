import React, { useState, useEffect, useCallback, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Import providers
import { ThemeProvider } from './components/ThemeContext';
import { SettingsProvider, SettingsContext } from './components/SettingsContext';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import InputForm from './components/InputForm';
import ProcessingStatus from './components/ProcessingStatus';
import ResultsDisplay from './components/ResultsDisplay';
import Settings from './components/Settings';

// Main App component
function AppContent() {
  // Access settings context
  const { settings } = useContext(SettingsContext);
  
  // State to manage the current step in the workflow
  const [currentStep, setCurrentStep] = useState('input'); // 'input', 'processing', 'results'
  
  // State to store job details
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  
  // State to store results
  const [results, setResults] = useState(null);
  
  // API configuration from settings
  const apiConfig = {
    transcriptionApiUrl: settings.transcriptionApiUrl || process.env.REACT_APP_TRANSCRIPTION_API_URL || 'http://localhost:8000',
    agentApiUrl: settings.llmApiUrl || process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8001',
  };
  
  // Define checkJobStatus with useCallback to prevent recreation on every render
  const checkJobStatus = useCallback(async () => {
    if (!jobId) return;
    
    try {
      const response = await fetch(`${apiConfig.agentApiUrl}/status/${jobId}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const statusData = await response.json();
      setJobStatus(statusData);
      
      // Update step if job is completed or has error
      if (statusData.status === 'completed') {
        setCurrentStep('results');
        setResults(statusData.result);
      } else if (statusData.status === 'error') {
        // Stay in processing step but show error
        console.error("Job error:", statusData.message);
      }
    } catch (error) {
      console.error("Error checking job status:", error);
    }
  }, [jobId, apiConfig.agentApiUrl]);
  
  // Function to poll job status
  useEffect(() => {
    let statusInterval;
    
    if (jobId && currentStep === 'processing') {
      statusInterval = setInterval(() => {
        checkJobStatus();
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (statusInterval) clearInterval(statusInterval);
    };
  }, [jobId, currentStep, checkJobStatus]);
  
  // Function to handle form submission
  const handleSubmit = (jobId) => {
    setJobId(jobId);
    setCurrentStep('processing');
  };
  
  // Function to reset the workflow
  const handleReset = () => {
    setJobId(null);
    setJobStatus(null);
    setResults(null);
    setCurrentStep('input');
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Toaster 
        position="top-center" 
        toastOptions={{
          // Default options for Toaster that work with dark mode
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route 
            path="/" 
            element={
              <>
                {currentStep === 'input' && (
                  <InputForm 
                    apiConfig={apiConfig} 
                    onSubmit={handleSubmit} 
                  />
                )}
                
                {currentStep === 'processing' && (
                  <ProcessingStatus 
                    jobId={jobId}
                    status={jobStatus}
                  />
                )}
                
                {currentStep === 'results' && (
                  <ResultsDisplay 
                    results={results}
                    onReset={handleReset}
                  />
                )}
              </>
            }
          />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      
      <Footer />
    </div>
  );
}

// Wrap the app with providers
function App() {
  return (
    <ThemeProvider>
      <SettingsProvider>
        <Router>
          <AppContent />
        </Router>
      </SettingsProvider>
    </ThemeProvider>
  );
}

export default App;