import React from 'react';

const PreviewModal = ({ isOpen, onClose, onApply, originalText, suggestedText, isLoading, error }) => {
  if (!isOpen) return null;

  const handleApply = () => {
    onApply(suggestedText);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Preview AI Changes
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="text-gray-600 dark:text-gray-400">Generating AI suggestions...</span>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-red-500 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 dark:text-red-400 font-medium">Error generating suggestions</p>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{error}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Original Text */}
              <div className="flex flex-col">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Original Text
                </h3>
                <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {originalText}
                  </pre>
                </div>
              </div>

              {/* Suggested Text */}
              <div className="flex flex-col">
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  AI Suggestion
                </h3>
                <div className="flex-1 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-mono">
                    {suggestedText}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 rounded-md transition-colors"
            >
              Apply Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreviewModal;