import { useState, useEffect, useCallback } from 'react';
import { SelectionManager } from '../services/selectionManager';
import type { TextSelection } from '../../shared/types/textSelection';

interface UseTextSelectionReturn {
  selection: TextSelection | null;
  hasSelection: boolean;
  clearSelection: () => void;
}

/**
 * Hook to detect and manage text selection on the page
 * Provides selection data and utility functions
 */
export function useTextSelection(): UseTextSelectionReturn {
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const handleSelectionChange = useCallback(() => {
    // Debounce to avoid excessive updates during selection
    const currentSelection = SelectionManager.getSelection();
    setSelection(currentSelection);
  }, []);

  const clearSelection = useCallback(() => {
    SelectionManager.clearSelection();
    setSelection(null);
  }, []);

  useEffect(() => {
    // Listen for selection changes
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
    };
  }, [handleSelectionChange]);

  return {
    selection,
    hasSelection: SelectionManager.hasSelection(),
    clearSelection,
  };
}
