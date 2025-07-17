import { useState, useEffect, useCallback } from 'react';

export const useTextSelection = (textareaRef) => {
  const [selectionData, setSelectionData] = useState({
    selectedText: '',
    selectionStart: 0,
    selectionEnd: 0,
    hasSelection: false,
    position: { x: 0, y: 0 }
  });

  // Store last valid selection to restore after tab switches
  const [lastValidSelection, setLastValidSelection] = useState(null);

  const updateSelection = useCallback(() => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    const hasSelection = selectedText.length > 0;

    if (hasSelection) {
      // Calculate position for floating toolbar
      const rect = textarea.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      // Position toolbar near the end of selection
      const position = {
        x: rect.left + scrollLeft + (rect.width / 2),
        y: rect.top + scrollTop - 60 // Position above the selection
      };

      const newSelectionData = {
        selectedText: selectedText.trim(),
        selectionStart: textarea.selectionStart,
        selectionEnd: textarea.selectionEnd,
        hasSelection,
        position
      };
      
      setSelectionData(newSelectionData);
      
      // Store this as the last valid selection if it has content
      if (hasSelection && selectedText.trim().length > 0) {
        setLastValidSelection(newSelectionData);
      }
    } else {
      setSelectionData({
        selectedText: '',
        selectionStart: 0,
        selectionEnd: 0,
        hasSelection: false,
        position: { x: 0, y: 0 }
      });
    }
  }, [textareaRef]);

  const clearSelection = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.setSelectionRange(0, 0);
    }
    setSelectionData({
      selectedText: '',
      selectionStart: 0,
      selectionEnd: 0,
      hasSelection: false,
      position: { x: 0, y: 0 }
    });
  }, [textareaRef]);

  const replaceSelectedText = useCallback((newText, onTextChange) => {
    if (!textareaRef.current || !onTextChange) return;

    const textarea = textareaRef.current;
    const { selectionStart, selectionEnd } = selectionData;
    const currentValue = textarea.value;
    
    const newValue = currentValue.substring(0, selectionStart) + 
                     newText + 
                     currentValue.substring(selectionEnd);
    
    // Update the React state through the parent component
    onTextChange(newValue);
    
    // Clear selection after replacement
    clearSelection();
  }, [textareaRef, selectionData, clearSelection]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const handleSelectionChange = () => {
      // Use setTimeout to ensure selection is updated after the event
      setTimeout(updateSelection, 0);
    };

    const handleMouseUp = handleSelectionChange;
    const handleKeyUp = handleSelectionChange;
    const handleClick = handleSelectionChange;
    const handleFocus = handleSelectionChange; // Add focus event to re-detect selection

    textarea.addEventListener('mouseup', handleMouseUp);
    textarea.addEventListener('keyup', handleKeyUp);
    textarea.addEventListener('click', handleClick);
    textarea.addEventListener('focus', handleFocus);

    return () => {
      textarea.removeEventListener('mouseup', handleMouseUp);
      textarea.removeEventListener('keyup', handleKeyUp);
      textarea.removeEventListener('click', handleClick);
      textarea.removeEventListener('focus', handleFocus);
    };
  }, [textareaRef, updateSelection]);

  const refreshSelection = useCallback(() => {
    updateSelection();
  }, [updateSelection]);

  const restoreLastSelection = useCallback(() => {
    if (!textareaRef.current || !lastValidSelection) return false;

    const textarea = textareaRef.current;
    
    // Check if the text at the stored position still matches
    const currentText = textarea.value.substring(
      lastValidSelection.selectionStart, 
      lastValidSelection.selectionEnd
    );
    
    if (currentText.trim() === lastValidSelection.selectedText) {
      // Restore the selection
      textarea.setSelectionRange(lastValidSelection.selectionStart, lastValidSelection.selectionEnd);
      textarea.focus();
      
      // Update selection data
      setTimeout(() => {
        updateSelection();
      }, 0);
      
      return true;
    }
    
    return false;
  }, [textareaRef, lastValidSelection, updateSelection]);

  return {
    selectionData,
    clearSelection,
    replaceSelectedText,
    refreshSelection,
    restoreLastSelection,
    hasStoredSelection: !!lastValidSelection
  };
};