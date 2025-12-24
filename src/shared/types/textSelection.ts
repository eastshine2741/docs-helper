export interface TextSelection {
  // Location
  xpath: string; // XPATH of element or nearest common ancestor
  indices?: { start: number; end: number }; // Character offsets (optional)

  // Content
  selectedText: string; // The actual text selected
  pageUrl: string; // URL where selection occurred

  // Position
  boundingRect: {
    top: number;
    right: number;
    bottom: number;
    left: number;
    width: number;
    height: number;
  };
}
