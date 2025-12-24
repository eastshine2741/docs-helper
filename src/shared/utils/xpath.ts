/**
 * Calculate XPATH for a DOM element
 * Prefers IDs when available for stability
 */
export function getXPath(element: Element): string {
  // If element has an ID, use it
  if (element.id) {
    return `//*[@id="${element.id}"]`;
  }

  // Build path from root
  const parts: string[] = [];
  let current: Element | null = element;

  while (current && current.nodeType === Node.ELEMENT_NODE) {
    let index = 0;
    let sibling: Element | null = current;

    // Count preceding siblings with same tag name
    while (sibling) {
      if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
        index++;
      }
      sibling = sibling.previousElementSibling;
    }

    const tagName = current.tagName.toLowerCase();
    const pathIndex = index > 1 ? `[${index}]` : '';
    parts.unshift(`${tagName}${pathIndex}`);

    current = current.parentElement;
  }

  return '/' + parts.join('/');
}

/**
 * Get element from XPATH
 */
export function getElementByXPath(xpath: string): Element | null {
  const result = document.evaluate(
    xpath,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue as Element | null;
}

/**
 * Find common ancestor element for a range
 */
export function getCommonAncestor(range: Range): Element {
  return range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
    ? (range.commonAncestorContainer as Element)
    : (range.commonAncestorContainer.parentElement as Element);
}

/**
 * Calculate character indices within an element for a range
 */
export function getTextIndices(
  element: Element,
  range: Range
): { start: number; end: number } | null {
  const textContent = element.textContent || '';

  // Create a range for the full element
  const fullRange = document.createRange();
  fullRange.selectNodeContents(element);

  // Calculate start index
  const startRange = fullRange.cloneRange();
  startRange.setEnd(range.startContainer, range.startOffset);
  const start = startRange.toString().length;

  // Calculate end index
  const endRange = fullRange.cloneRange();
  endRange.setEnd(range.endContainer, range.endOffset);
  const end = endRange.toString().length;

  // Validate
  if (start >= 0 && end > start && end <= textContent.length) {
    return { start, end };
  }

  return null;
}

/**
 * Check if range is within a single element
 */
export function isWithinSingleElement(range: Range): boolean {
  const startElement = range.startContainer.nodeType === Node.ELEMENT_NODE
    ? range.startContainer
    : range.startContainer.parentElement;

  const endElement = range.endContainer.nodeType === Node.ELEMENT_NODE
    ? range.endContainer
    : range.endContainer.parentElement;

  return startElement === endElement;
}
