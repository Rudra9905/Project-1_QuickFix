# Quick Helper Design System

This document outlines the design system implemented for the Quick Helper web application, inspired by premium home-service mobile apps like Urban Company and Snabbit.

## Color Palette

### Primary Colors
- **Deep Purple**: `#5a00f0` (Primary brand color for actions and highlights)
- **Alternative Deep Purple**: `#4b2ea6` (Secondary purple for variations)
- **Purple Light**: `#7658ff` (Lighter purple for gradients and accents)

### Background Colors
- **Soft Lavender**: `#f6f4ff` (Main background color)
- **Light Lavender**: `#efebff` (For hover states and subtle backgrounds)
- **White**: `#ffffff` (Cards, modals, and content areas)

### Text Colors
- **Dark Navy**: `#0f172a` (Primary text)
- **Charcoal/Muted Grey**: `#64748b` (Secondary text)
- **Light Grey**: `#e2e8f0` (Dividers and borders)

## Typography

### Font Family
- Primary: Inter, SF Pro, Poppins (fallbacks: system-ui, Avenir, Helvetica, Arial, sans-serif)

### Font Weights
- Headings: 600-700 (Bold)
- Body Text: 400-500 (Regular to Medium)
- Prices & CTAs: 600 (Semi-bold)

### Font Sizes
- Display: 2rem (32px) - Main page titles
- Heading: 1.5rem (24px) - Section titles
- Subheading: 1.25rem (20px) - Card titles
- Body: 1rem (16px) - Paragraph text
- Caption: 0.875rem (14px) - Small text, labels

## Components

### Buttons
- Background: Solid purple (`#5a00f0`)
- Text: White
- Border Radius: 0.75rem (12px)
- Shadow: Soft purple shadow
- Hover Effect: Lift effect with enhanced shadow

### Cards
- Background: White (`#ffffff`)
- Border Radius: 1rem (16px)
- Padding: 1.5rem (24px)
- Border: 1px solid light grey (`#e2e8f0`)
- Shadow: Subtle shadow for depth
- Hover Effect: Slight lift with enhanced shadow

### Navigation Bar
- Background: Soft lavender (`#f6f4ff`)
- Border: Light lavender (`#efebff`)
- Brand Name: Deep purple (`#4b2ea6`) with semi-bold font
- Text: Dark navy (`#0f172a`) for primary items, muted grey (`#64748b`) for secondary items
- Height: Increased to 5rem (80px) for better visual balance
- Padding: Increased horizontal padding for spacious feel
- Notification Badge: Rounded with purple background and white text

### Spacing
- Small: 0.5rem (8px)
- Medium: 1rem (16px)
- Large: 1.5rem (24px)

## Implementation

All styles are implemented using:
1. Tailwind CSS with custom color extensions
2. Global CSS utilities in `design-system.css`
3. Component-level styling in React components

The design system creates a clean, calm, premium feel with a clear visual hierarchy, smooth spacing, and elegant typography similar to modern iOS service apps.