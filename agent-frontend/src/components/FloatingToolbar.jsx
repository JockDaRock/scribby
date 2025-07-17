import { useState, useRef, useCallback, useEffect } from 'react';

const FloatingToolbar = ({ position, onOperation, isVisible, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentPosition, setCurrentPosition] = useState(position);
  const [hasBeenManuallyPositioned, setHasBeenManuallyPositioned] = useState(false);
  const toolbarRef = useRef(null);
  const previousPositionRef = useRef(position);

  // Update position when prop changes (but only if user hasn't manually positioned it)
  useEffect(() => {
    if (!isDragging && !hasBeenManuallyPositioned) {
      setCurrentPosition(position);
    }
  }, [position, isDragging, hasBeenManuallyPositioned]);

  // Reset manual positioning when the position prop changes significantly (new selection)
  useEffect(() => {
    // Only check for new selections if we're not currently dragging
    if (!isDragging && hasBeenManuallyPositioned && previousPositionRef.current && position) {
      const distanceX = Math.abs(position.x - previousPositionRef.current.x);
      const distanceY = Math.abs(position.y - previousPositionRef.current.y);
      
      // If the new position prop is significantly different (> 100px), it's likely a new selection
      if (distanceX > 100 || distanceY > 100) {
        setHasBeenManuallyPositioned(false);
        // The first useEffect will handle updating currentPosition
      }
    }
    
    // Update the previous position ref only when not dragging
    if (!isDragging) {
      previousPositionRef.current = position;
    }
  }, [position, hasBeenManuallyPositioned, isDragging]);

  const handleMouseDown = useCallback((e) => {
    if (e.target.closest('.drag-handle')) {
      e.preventDefault();
      setIsDragging(true);
      
      const rect = toolbarRef.current.getBoundingClientRect();
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (isDragging && toolbarRef.current) {
      e.preventDefault();
      
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      
      const newX = clientX - dragOffset.x;
      const newY = clientY - dragOffset.y;
      
      // Keep toolbar within viewport bounds
      const toolbar = toolbarRef.current;
      const rect = toolbar.getBoundingClientRect();
      const maxX = window.innerWidth - rect.width;
      const maxY = window.innerHeight - rect.height;
      
      setCurrentPosition({
        x: Math.max(0, Math.min(newX, maxX)),
        y: Math.max(0, Math.min(newY, maxY))
      });
    }
  }, [isDragging, dragOffset]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setHasBeenManuallyPositioned(true); // Mark as manually positioned
    }
  }, [isDragging]);

  const handleDoubleClick = useCallback(() => {
    // Reset to auto-positioning on double-click
    setHasBeenManuallyPositioned(false);
    setCurrentPosition(position);
  }, [position]);

  // Global mouse and touch event listeners
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove);
      document.addEventListener('touchend', handleMouseUp);
      document.body.style.userSelect = 'none'; // Prevent text selection while dragging
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleMouseMove);
        document.removeEventListener('touchend', handleMouseUp);
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isVisible) return null;

  const operations = [
    { id: 'improve', label: 'Improve', icon: '✨', instruction: 'Improve the writing style and clarity of this text' },
    { id: 'summarize', label: 'Summarize', icon: '📝', instruction: 'Make this text more concise and to the point' },
    { id: 'expand', label: 'Expand', icon: '📚', instruction: 'Expand on this text with more details and examples' },
    { id: 'rewrite', label: 'Rewrite', icon: '🔄', instruction: 'Rewrite this text in a different tone or style' },
    { id: 'spelling', label: 'Fix', icon: '🔧', instruction: 'Fix spelling, grammar, and punctuation errors in this text' },
    { id: 'custom', label: 'Custom', icon: '⚡', instruction: 'custom' }
  ];

  const handleCustomOperation = () => {
    const customInstruction = window.prompt('Enter your custom instruction:');
    if (customInstruction && customInstruction.trim()) {
      onOperation('custom', customInstruction.trim());
    }
  };

  const handleOperation = (operationId, instruction) => {
    if (operationId === 'custom') {
      handleCustomOperation();
    } else {
      onOperation(operationId, instruction);
    }
  };

  return (
    <div 
      ref={toolbarRef}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
      className={`fixed z-50 bg-white dark:bg-gray-800 border rounded-lg shadow-lg transition-all duration-200 ${
        hasBeenManuallyPositioned 
          ? 'border-blue-300 dark:border-blue-600' 
          : 'border-gray-200 dark:border-gray-700'
      } ${
        isDragging ? 'shadow-2xl scale-105 cursor-grabbing' : 'shadow-lg hover:shadow-xl'
      }`}
      style={{
        left: `${currentPosition.x}px`,
        top: `${currentPosition.y}px`,
        transform: isDragging ? 'none' : 'translateX(-50%)'
      }}
    >
      {/* Drag Handle */}
      <div 
        className="drag-handle flex items-center justify-center py-2 px-4 cursor-grab active:cursor-grabbing hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150 border-b border-gray-200 dark:border-gray-600"
        onDoubleClick={handleDoubleClick}
        title="Drag to move • Double-click to reset position"
      >
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
          <div className="w-1 h-1 bg-gray-400 dark:bg-gray-500 rounded-full"></div>
        </div>
        <span className="ml-2 text-xs text-gray-500 dark:text-gray-400 select-none">
          {hasBeenManuallyPositioned ? 'Double-click to reset' : 'Drag to move'}
        </span>
      </div>
      
      {/* Toolbar Content */}
      <div className="p-2 flex space-x-1">
        {operations.map((op) => (
          <button
            key={op.id}
            onClick={() => handleOperation(op.id, op.instruction)}
            disabled={isProcessing}
            className={`
              px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200
              flex items-center space-x-1 min-w-max
              ${isProcessing 
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                : 'bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-500 dark:hover:bg-purple-600'
              }
            `}
            title={op.instruction}
          >
            <span className="text-xs">{op.icon}</span>
            <span>{op.label}</span>
          </button>
        ))}
        
        {isProcessing && (
          <div className="px-3 py-2 flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600"></div>
            <span className="text-sm text-gray-600 dark:text-gray-400">Processing...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FloatingToolbar;