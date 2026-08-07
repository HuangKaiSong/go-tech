export type QualityTier = 'high' | 'low' | 'medium';

export interface NebulaQualityProfile {
  antialias: boolean;
  galaxyCount: number;
  lensFlare: {
    aditionalStreaks: boolean;
    secondaryGhosts: boolean;
    starBurst: boolean;
  };
  maxPixelRatio: number;
  maxRenderPixels: number;
  minPixelRatio: number;
  planetDetail: number;
  targetFps: number | null;
  tier: QualityTier;
}

export type NebulaQualityPreference = 'auto' | QualityTier;

const QUALITY_PROFILES: Record<QualityTier, NebulaQualityProfile> = {
  high: {
    tier: 'high',
    antialias: true,
    galaxyCount: 140000,
    planetDetail: 64,
    maxPixelRatio: 1.25,
    minPixelRatio: 1,
    maxRenderPixels: 6000000,
    targetFps: null,
    lensFlare: {
      starBurst: true,
      secondaryGhosts: true,
      aditionalStreaks: true
    }
  },
  medium: {
    tier: 'medium',
    antialias: true,
    galaxyCount: 70000,
    planetDetail: 24,
    maxPixelRatio: 1,
    minPixelRatio: 0.8,
    maxRenderPixels: 3500000,
    targetFps: 45,
    lensFlare: {
      starBurst: false,
      secondaryGhosts: true,
      aditionalStreaks: true
    }
  },
  low: {
    tier: 'low',
    antialias: false,
    galaxyCount: 35000,
    planetDetail: 12,
    maxPixelRatio: 0.85,
    minPixelRatio: 0.6,
    maxRenderPixels: 2000000,
    targetFps: 30,
    lensFlare: {
      starBurst: false,
      secondaryGhosts: false,
      aditionalStreaks: false
    }
  }
};

type NavigatorWithHardwareInfo = Navigator & {
  connection?: { saveData?: boolean };
  deviceMemory?: number;
  userAgentData?: { mobile?: boolean };
};

export interface NebulaGraphicsCapability {
  hardwareAccelerated: boolean;
  maxTextureSize: number;
  renderer: string;
  webglAvailable: boolean;
}

let cachedGraphicsCapability: NebulaGraphicsCapability | undefined;

export function detectNebulaGraphicsCapability(): NebulaGraphicsCapability {
  if (cachedGraphicsCapability) return cachedGraphicsCapability;

  const canvas = document.createElement('canvas');
  const context =
    canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: true, powerPreference: 'high-performance' }) ??
    canvas.getContext('webgl', { failIfMajorPerformanceCaveat: true, powerPreference: 'high-performance' });

  if (!context) {
    cachedGraphicsCapability = {
      hardwareAccelerated: false,
      maxTextureSize: 0,
      renderer: '',
      webglAvailable: false
    };
    return cachedGraphicsCapability;
  }

  const debugInfo = context.getExtension('WEBGL_debug_renderer_info');
  const renderer = debugInfo ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)).toLowerCase() : '';
  const maxTextureSize = Number(context.getParameter(context.MAX_TEXTURE_SIZE));
  const hardwareAccelerated = !/swiftshader|llvmpipe|software|microsoft basic render/.test(renderer);
  context.getExtension('WEBGL_lose_context')?.loseContext();

  cachedGraphicsCapability = {
    hardwareAccelerated,
    maxTextureSize,
    renderer,
    webglAvailable: true
  };
  return cachedGraphicsCapability;
}

export function canUseNebula(): boolean {
  const capability = detectNebulaGraphicsCapability();
  return capability.webglAvailable && capability.hardwareAccelerated;
}

function getWebGlPressure(): number {
  const capability = detectNebulaGraphicsCapability();

  if (!capability.webglAvailable || !capability.hardwareAccelerated) return 4;
  if (/intel.*(?:hd graphics|uhd graphics)/.test(capability.renderer)) return 2;
  if (capability.maxTextureSize <= 4096) return 2;
  if (capability.maxTextureSize <= 8192) return 1;
  return 0;
}

function getAutomaticTier(): QualityTier {
  const navigatorWithHardwareInfo = navigator as NavigatorWithHardwareInfo;
  const cores = navigator.hardwareConcurrency;
  const memory = navigatorWithHardwareInfo.deviceMemory;
  const renderedPixels = window.innerWidth * window.innerHeight * window.devicePixelRatio ** 2;
  const isMobile =
    navigatorWithHardwareInfo.userAgentData?.mobile ?? /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  let pressureScore = getWebGlPressure();

  if (isMobile) {
    pressureScore += 2;
  }

  if (typeof cores === 'number') {
    pressureScore += cores <= 4 ? 2 : cores <= 6 ? 1 : 0;
  }

  if (typeof memory === 'number') {
    pressureScore += memory <= 2 ? 3 : memory <= 4 ? 2 : 0;
  }

  pressureScore += renderedPixels >= 12000000 ? 2 : renderedPixels >= 8000000 ? 1 : 0;

  if (navigatorWithHardwareInfo.connection?.saveData) {
    pressureScore += 2;
  }

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pressureScore += 2;
  }

  if (pressureScore >= 4) return 'low';
  if (pressureScore >= 2) return 'medium';
  return 'high';
}

export function resolveNebulaQuality(preference: NebulaQualityPreference = 'auto'): NebulaQualityProfile {
  const tier = preference === 'auto' ? getAutomaticTier() : preference;
  const profile = QUALITY_PROFILES[tier];

  return {
    ...profile,
    lensFlare: { ...profile.lensFlare }
  };
}
