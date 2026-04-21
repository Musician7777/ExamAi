/**
 * Shared chart theme utilities for Recharts components.
 *
 * CSS custom properties like hsl(var(--border)) don't resolve inside SVG
 * fill/stroke attributes, so we read computed values from the document root
 * and provide actual hex/hsl values that Recharts can use.
 */

/**
 * Resolves CSS custom properties to actual color values for Recharts SVG attributes.
 * Returns fallback values during SSR or before document is available.
 */
export function resolveChartColors() {
  if (typeof document === 'undefined') {
    return {
      border: 'rgba(99, 102, 241, 0.12)',
      mutedFg: '#64748b',
      primary: '#6366f1',
    };
  }
  const style = getComputedStyle(document.documentElement);
  const border = style.getPropertyValue('--color-border')?.trim() || 'rgba(99,102,241,0.12)';
  const mutedFg = style.getPropertyValue('--color-muted-foreground')?.trim() || '#64748b';
  const primary = style.getPropertyValue('--color-primary')?.trim() || '#6366f1';
  return { border, mutedFg, primary };
}

/** Shared tooltip style for all Recharts charts */
export const CustomTooltipStyle = {
  backgroundColor: 'rgba(15, 23, 42, 0.92)',
  border: '1px solid rgba(99, 102, 241, 0.3)',
  borderRadius: '10px',
  padding: '10px 14px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
};
