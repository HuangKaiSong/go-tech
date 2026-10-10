export type ViewMode = 'auto' | 'mobile' | 'pc';

export const VIEW_MODE_COOKIE = 'GO_TECH_VIEW_MODE';
export const MOBILE_BREAKPOINT = 768;

export function parseViewMode(value: unknown): ViewMode | undefined {
  return value === 'auto' || value === 'mobile' || value === 'pc' ? value : undefined;
}

/** Keep the same logical viewport sizes as the reference mobile preview. */
export function getViewFrame(mode: ViewMode, viewport: { height: number; width: number }) {
  const viewportWidth = Math.max(1, viewport.width);
  let width = viewportWidth;
  let scale = 1;

  if (mode === 'mobile') {
    width = viewportWidth < 1024 ? Math.min(767, viewportWidth) : 430;
    scale = viewportWidth < 1024 ? viewportWidth / width : 1;
  } else if (mode === 'pc') {
    width = Math.max(1280, viewportWidth);
    scale = viewportWidth / width;
  }

  return { width, height: Math.max(1, viewport.height) / scale, scale };
}
