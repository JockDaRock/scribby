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
    
    // Check if the textarea is focused and has an active selection
    const isFocused = document.activeElement === textarea;
    const selectedText = textarea.value.substring(textarea.selectionStart, textarea.selectionEnd);
    const hasSelection = isFocused && selectedText.length > 0 && selectedText.trim().length > 0;

    console.log('Selection update:', { 
      selectedText, 
      hasSelection, 
      start: textarea.selectionStart, 
      end: textarea.selectionEnd,
      isFocused,
      activeElement: document.activeElement
    });

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
      setLastValidSelection(newSelectionData);
    } else {
      console.log('Clearing selection');
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
    console.log('clearSelection called');
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
    const handleInput = handleSelectionChange; // Add input event
    const handleBlur = () => {
      console.log('Textarea lost focus, clearing selection');
      // Clear selection when textarea loses focus
      setTimeout(() => {
        setSelectionData({
          selectedText: '',
          selectionStart: 0,
          selectionEnd: 0,
          hasSelection: false,
          position: { x: 0, y: 0 }
        });
      }, 100); // Small delay to allow clicks on toolbar
    };

    textarea.addEventListener('mouseup', handleMouseUp);
    textarea.addEventListener('keyup', handleKeyUp);
    textarea.addEventListener('click', handleClick);
    textarea.addEventListener('focus', handleFocus);
    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('blur', handleBlur);
    
    // Use global selectionchange event
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      textarea.removeEventListener('mouseup', handleMouseUp);
      textarea.removeEventListener('keyup', handleKeyUp);
      textarea.removeEventListener('click', handleClick);
      textarea.removeEventListener('focus', handleFocus);
      textarea.removeEventListener('input', handleInput);
      textarea.removeEventListener('blur', handleBlur);
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [textareaRef, updateSelection]);

  // Add global click handler to detect clicks outside the textarea
  useEffect(() => {
    const handleDocumentClick = (event) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      console.log('Document click detected:', event.target);
      // If clicking outside the textarea and not on the floating toolbar
      if (!textarea.contains(event.target) && !event.target.closest('.floating-toolbar')) {
        console.log('Clearing selection due to outside click');
        clearSelection();
      }
    };

    const handleTextareaClick = (event) => {
      console.log('Textarea click detected');
      // Use a longer timeout to ensure the selection change has been processed
      setTimeout(() => {
        updateSelection();
      }, 10);
    };

    // Add escape key handler
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape' && selectionData.hasSelection) {
        console.log('Escape key pressed, clearing selection');
        clearSelection();
      }
    };

    const textarea = textareaRef.current;
    
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleEscapeKey);
    
    if (textarea) {
      textarea.addEventListener('click', handleTextareaClick);
    }

    return () => {
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleEscapeKey);
      if (textarea) {
        textarea.removeEventListener('click', handleTextareaClick);
      }
    };
  }, [textareaRef, clearSelection, selectionData.hasSelection]);

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