# Extension Icons

## Required Icons (TODO)

You need to create these PNG files:
- `icon-16.png` - 16x16 pixels (shown in extension toolbar)
- `icon-48.png` - 48x48 pixels (shown in extension management page)
- `icon-128.png` - 128x128 pixels (shown in Chrome Web Store)

## Quick Solution

You can use online tools to convert `icon.svg` to PNG at different sizes:
- https://svg2png.com/
- Or use any image editor (Figma, Photoshop, GIMP)

Alternatively, use this command with ImageMagick (if installed):
```bash
convert icon.svg -resize 16x16 icon-16.png
convert icon.svg -resize 48x48 icon-48.png
convert icon.svg -resize 128x128 icon-128.png
```

## Design Guidelines

- Use simple, recognizable designs
- Consider the "documentation helper" theme
- Ensure icons work well at small sizes
- Use PNG format with transparency

**Note**: The extension will not load until valid PNG icons are provided.
