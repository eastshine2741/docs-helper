import type { TextSelection } from '../../shared/types/textSelection';
import {
  getXPath,
  getCommonAncestor,
  getTextIndices,
  isWithinSingleElement,
} from '../../shared/utils/xpath';

export class SelectionManager {
  /**
   * Get current text selection and convert to TextSelection type
   */
  static getSelection(): TextSelection | null {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.rangeCount) {
      return null;
    }

    const range = selection.getRangeAt(0);
    const selectedText = selection.toString().trim();

    if (!selectedText) {
      return null;
    }

    // Get bounding rectangle
    const rect = range.getBoundingClientRect();

    // Determine if selection is within single element
    const withinSingle = isWithinSingleElement(range);

    let xpath: string;
    let indices: { start: number; end: number } | undefined;

    if (withinSingle) {
      // Selection within single element - use element XPATH + indices
      const element = range.startContainer.nodeType === Node.ELEMENT_NODE
        ? (range.startContainer as Element)
        : (range.startContainer.parentElement as Element);

      xpath = getXPath(element);
      indices = getTextIndices(element, range) || undefined;
    } else {
      // Selection spans multiple elements - use common ancestor XPATH only
      const ancestor = getCommonAncestor(range);
      xpath = getXPath(ancestor);
      indices = undefined;
    }

    return {
      xpath,
      indices,
      selectedText,
      pageUrl: window.location.href,
      boundingRect: {
        top: rect.top,
        right: rect.right,
        bottom: rect.bottom,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    };
  }

  /**
   * Clear current selection
   */
  static clearSelection(): void {
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
    }
  }

  /**
   * Check if there's an active selection
   */
  static hasSelection(): boolean {
    const selection = window.getSelection();
    return !!(selection && !selection.isCollapsed && selection.toString().trim());
  }
}
