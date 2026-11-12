/**
 * Layout capacity table and auto-adjust rules for the multi-panel grid.
 * This build only supports horizontal (single-row) layouts: 1x1 ... 1x12.
 * Kept separate from multi-panel.js so tests exercise the production logic.
 */

export const HORIZONTAL_LAYOUT_PATTERN = /^1x(\d+)$/;
export const MAX_HORIZONTAL_COLUMNS = 12;

export const LAYOUT_PANEL_COUNTS = {
  '1x1': 1,
  '1x2': 2,
  '1x3': 3,
  '1x4': 4,
  '1x5': 5,
  '1x6': 6,
  '1x7': 7,
  '1x8': 8,
  '1x9': 9,
  '1x10': 10,
  '1x11': 11,
  '1x12': 12
};

/**
 * Whether the given layout name is a supported horizontal layout.
 * @param {string} layout
 * @returns {boolean}
 */
export function isHorizontalLayout(layout) {
  return typeof layout === 'string' && Object.prototype.hasOwnProperty.call(LAYOUT_PANEL_COUNTS, layout);
}

/**
 * Build the horizontal layout name for a panel count.
 * @param {number} panelCount
 * @returns {string}
 */
export function getHorizontalLayoutForCount(panelCount) {
  const columns = Math.min(Math.max(Math.round(Number(panelCount) || 1), 1), MAX_HORIZONTAL_COLUMNS);
  return `1x${columns}`;
}

/**
 * Calculates whether layout adjustment is needed based on current layout and panel count.
 * Only horizontal 1xN layouts exist, so adding a panel grows the column count.
 * @param {string} currentLayout - Current layout, e.g., '1x2'
 * @param {number} newPanelCount - Total panel count after adding
 * @returns {string|null} - New layout name, or null if no adjustment needed
 */
export function getAutoAdjustedLayout(currentLayout, newPanelCount) {
  if (!isHorizontalLayout(currentLayout)) return null;

  const currentCapacity = LAYOUT_PANEL_COUNTS[currentLayout];
  if (newPanelCount <= currentCapacity) return null;

  const nextLayout = getHorizontalLayoutForCount(newPanelCount);
  return nextLayout === currentLayout ? null : nextLayout;
}

/**
 * Calculates whether layout shrink is needed based on current layout and panel count.
 * @param {string} currentLayout - Current layout, e.g., '1x3'
 * @param {number} newPanelCount - Total panel count after removing
 * @returns {string|null} - New layout name, or null if no adjustment needed
 */
export function getAutoShrunkLayout(currentLayout, newPanelCount) {
  if (!isHorizontalLayout(currentLayout)) return null;

  const currentCols = LAYOUT_PANEL_COUNTS[currentLayout];
  if (newPanelCount >= currentCols) return null;

  const targetLayout = getHorizontalLayoutForCount(Math.max(newPanelCount, 1));
  return targetLayout === currentLayout ? null : targetLayout;
}
