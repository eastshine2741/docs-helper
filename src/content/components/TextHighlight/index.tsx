import React, { useEffect, useRef } from 'react';
import { getElementByXPath } from '../../../shared/utils/xpath';

interface TextHighlightProps {
  xpath: string;
  indices?: { start: number; end: number };
  isExpanded: boolean;
}

export const TextHighlight: React.FC<TextHighlightProps> = ({
  xpath,
  isExpanded,
}) => {
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Get the element from XPATH
    const element = getElementByXPath(xpath);
    if (!element) return;

    const rect = element.getBoundingClientRect();

    // Position highlight overlay
    if (highlightRef.current) {
      highlightRef.current.style.top = `${rect.top + window.scrollY}px`;
      highlightRef.current.style.left = `${rect.left + window.scrollX}px`;
      highlightRef.current.style.width = `${rect.width}px`;
      highlightRef.current.style.height = `${rect.height}px`;
    }
  }, [xpath]);

  return (
    <div
      ref={highlightRef}
      style={{
        position: 'absolute',
        backgroundColor: isExpanded ? '#90CDF4' : '#BEE3F8',
        opacity: isExpanded ? 0.3 : 0.15,
        pointerEvents: 'none',
        transition: 'opacity 0.2s',
        zIndex: 1,
      }}
    />
  );
};
