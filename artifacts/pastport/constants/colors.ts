/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    // Legacy aliases (kept for backward compatibility)
    text: '#F7F5FF',
    tint: '#B99CFF',

    // Core surfaces
    background: '#080812',
    foreground: '#F7F5FF',

    // Cards / elevated surfaces
    card: '#131324',
    cardForeground: '#F7F5FF',

    // Primary action color (buttons, links, active states)
    primary: '#B99CFF',
    primaryForeground: '#ffffff',

    // Secondary / less-emphasis interactive surfaces
    secondary: '#24213B',
    secondaryForeground: '#F7F5FF',

    // Muted / subdued elements (dividers, timestamps, placeholders)
    muted: '#1A192B',
    mutedForeground: '#9B98AF',

    // Accent highlights (badges, selected items, focus rings)
    accent: '#E9B66B',
    accentForeground: '#0A0A13',

    // Destructive actions (delete, error states)
    destructive: '#F47C7C',
    destructiveForeground: '#ffffff',

    // Borders and input outlines
    border: '#2A2842',
    input: '#2A2842',
  },

  // Border radius (in px). Sync from the sibling web artifact's --radius
  // CSS variable. This value applies to cards, buttons, inputs, and modals.
  radius: 8,
};

export default colors;
