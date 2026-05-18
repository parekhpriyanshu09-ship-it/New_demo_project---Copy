const palette = {
  text: "#FFFFFF",

  // Change these six colors to reskin the whole project.
  primaryDeep: "#718355",
  secondary: "#87986a",
  accentPrimary: "#97a97c",
  accentLight: "#b5c99a",
  hoverLight: "#cfe1b9",
  softHighlight: "#e9f5db",

  background: "#f5f7fa",
  foreground: "#1a2332",
  card: "#ffffff",
  danger: "#dc2626",
  warning: "#f59e0b",
  success: "#10b981",
  pink: "#ec4899",
};

const alpha = (hex, opacity) => {
  const value = hex.replace("#", "");
  const bigint = Number.parseInt(value, 16);
  const red = (bigint >> 16) & 255;
  const green = (bigint >> 8) & 255;
  const blue = bigint & 255;
  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

const makeGradient = (...stops) => `linear-gradient(${stops.join(", ")})`;

export const appTheme = {
  palette,
  light: {
    background: palette.background,
    foreground: palette.foreground,
    card: palette.card,
    cardForeground: palette.foreground,
    popover: palette.card,
    popoverForeground: palette.foreground,
    primary: palette.primaryDeep,
    primaryForeground: palette.text,
    secondary: "#e8f0f7",
    secondaryForeground: palette.primaryDeep,
    muted: "#f0f5f9",
    mutedForeground: "#6b7d8f",
    accent: palette.accentPrimary,
    accentForeground: palette.text,
    destructive: palette.danger,
    destructiveForeground: palette.text,
    border: "#d1dce6",
    input: palette.card,
    ring: palette.accentPrimary,
  },
  dark: {
    background: "#0f1729",
    foreground: "#e8eef6",
    card: "#1a2332",
    cardForeground: "#e8eef6",
    popover: "#1a2332",
    popoverForeground: "#e8eef6",
    primary: palette.accentPrimary,
    primaryForeground: palette.primaryDeep,
    secondary: "#1a2f42",
    secondaryForeground: "#e8eef6",
    muted: "#2a3d52",
    mutedForeground: "#a0abb8",
    accent: palette.accentPrimary,
    accentForeground: "#0f1729",
    destructive: "#f87171",
    destructiveForeground: "#0f1729",
    border: alpha(palette.text, 0.1),
    input: "#1a2332",
    ring: palette.accentPrimary,
  },
  brand: {
    dark: palette.primaryDeep,
    accent: palette.accentPrimary,
    light: "#e8f0f7",
    lighter: "#f0f5f9",
    darkHover: palette.secondary,
    accentHover: palette.hoverLight,
    accentLight: "#e8f0f7",
  },
  category: {
    purple: palette.primaryDeep,
    green: palette.accentPrimary,
    orange: palette.warning,
    pink: palette.pink,
    blue: palette.accentLight,
    teal: palette.hoverLight,
  },
  gradients: {
    app: palette.background,
    brand: makeGradient("135deg", `${palette.accentPrimary} 0%`, `${palette.primaryDeep} 100%`),
    brandReverse: makeGradient("135deg", `${palette.primaryDeep} 0%`, `${palette.accentPrimary} 100%`),
    sidebar: makeGradient("180deg", `${palette.primaryDeep} 0%`, `${palette.secondary} 100%`),
    header: makeGradient(
      "135deg",
      `${palette.primaryDeep} 0%`,
      `${palette.secondary} 25%`,
      `${palette.accentPrimary} 50%`,
      `${palette.accentLight} 75%`,
      `${palette.hoverLight} 100%`,
    ),
    buttonPrimary: makeGradient("135deg", `${palette.accentPrimary} 0%`, `${palette.primaryDeep} 100%`),
    line: makeGradient("90deg", palette.accentPrimary, palette.primaryDeep),
    timeline: makeGradient("180deg", `${palette.accentPrimary} 0%`, `${palette.primaryDeep} 100%`),
    cardBlue: makeGradient("135deg", "#f0f5f9 0%", "#e8f0f7 100%"),
    cardMint: makeGradient("135deg", "#e8f0f7 0%", "#d1dce6 100%"),
    cardPink: makeGradient("135deg", "#fce7f3 0%", "#fbcfe8 100%"),
    cardYellow: makeGradient("135deg", "#fef3c7 0%", "#fde68a 100%"),
    cardPurple: makeGradient("135deg", "#f3e8ff 0%", "#e9d5ff 100%"),
    cardGray: makeGradient("135deg", "#f9fafb 0%", "#f3f4f6 100%"),
  },
  shadows: {
    glass: `0 6px 18px -8px ${alpha(palette.primaryDeep, 0.16)}, 0 2px 6px -2px ${alpha(palette.accentPrimary, 0.08)}`,
    glow: `0 14px 36px -16px ${alpha(palette.accentPrimary, 0.3)}`,
    soft: `0 6px 16px -8px ${alpha(palette.primaryDeep, 0.14)}`,
    brand: `0 10px 30px -10px ${alpha(palette.accentPrimary, 0.24)}`,
  },
  sidebar: {
    background: palette.primaryDeep,
    foreground: palette.text,
    primary: palette.accentPrimary,
    primaryForeground: palette.text,
    accent: palette.accentPrimary,
    accentForeground: palette.text,
    border: alpha(palette.text, 0.1),
    ring: palette.accentPrimary,
  },
  dashboard: {
    text: palette.text,
    primaryDeep: palette.primaryDeep,
    secondary: palette.secondary,
    accentPrimary: palette.accentPrimary,
    accentLight: palette.accentLight,
    hoverLight: palette.hoverLight,
    softHighlight: palette.softHighlight,
    tabs: {
      background: palette.primaryDeep,
      active: palette.accentPrimary,
      hover: palette.accentLight,
    },
    cards: {
      background: palette.secondary,
      hover: palette.accentLight,
      borderGlow: palette.hoverLight,
    },
    buttons: {
      background: palette.accentPrimary,
      hover: palette.hoverLight,
    },
    series: [
      palette.primaryDeep,
      palette.secondary,
      palette.accentPrimary,
      palette.accentLight,
      palette.hoverLight,
      palette.softHighlight,
    ],
    headerGradient: makeGradient(
      "135deg",
      `${palette.primaryDeep} 0%`,
      `${palette.secondary} 25%`,
      `${palette.accentPrimary} 50%`,
      `${palette.accentLight} 75%`,
      `${palette.hoverLight} 100%`,
    ),
  },
};

const cssVariables = {
  "--brand-dark": appTheme.brand.dark,
  "--brand-accent": appTheme.brand.accent,
  "--brand-light": appTheme.brand.light,
  "--brand-lighter": appTheme.brand.lighter,
  "--brand-dark-hover": appTheme.brand.darkHover,
  "--brand-accent-hover": appTheme.brand.accentHover,
  "--brand-accent-light": appTheme.brand.accentLight,
  "--cat-purple": appTheme.category.purple,
  "--cat-green": appTheme.category.green,
  "--cat-orange": appTheme.category.orange,
  "--cat-pink": appTheme.category.pink,
  "--cat-blue": appTheme.category.blue,
  "--cat-teal": appTheme.category.teal,
  "--gradient-app": appTheme.gradients.app,
  "--gradient-brand": appTheme.gradients.brand,
  "--gradient-brand-reverse": appTheme.gradients.brandReverse,
  "--gradient-sidebar": appTheme.gradients.sidebar,
  "--gradient-header": appTheme.gradients.header,
  "--gradient-button-primary": appTheme.gradients.buttonPrimary,
  "--gradient-card-blue": appTheme.gradients.cardBlue,
  "--gradient-card-mint": appTheme.gradients.cardMint,
  "--gradient-card-pink": appTheme.gradients.cardPink,
  "--gradient-card-yellow": appTheme.gradients.cardYellow,
  "--gradient-card-purple": appTheme.gradients.cardPurple,
  "--gradient-card-gray": appTheme.gradients.cardGray,
  "--gradient-line": appTheme.gradients.line,
  "--gradient-timeline": appTheme.gradients.timeline,
  "--shadow-glass": appTheme.shadows.glass,
  "--shadow-glow": appTheme.shadows.glow,
  "--shadow-soft": appTheme.shadows.soft,
  "--shadow-brand": appTheme.shadows.brand,
  "--sidebar-background": appTheme.sidebar.background,
  "--sidebar-foreground": appTheme.sidebar.foreground,
  "--sidebar-primary": appTheme.sidebar.primary,
  "--sidebar-primary-foreground": appTheme.sidebar.primaryForeground,
  "--sidebar-accent": appTheme.sidebar.accent,
  "--sidebar-accent-foreground": appTheme.sidebar.accentForeground,
  "--sidebar-border": appTheme.sidebar.border,
  "--sidebar-ring": appTheme.sidebar.ring,
  "--dashboard-text": appTheme.dashboard.text,
  "--dashboard-primary-deep": appTheme.dashboard.primaryDeep,
  "--dashboard-secondary": appTheme.dashboard.secondary,
  "--dashboard-accent-primary": appTheme.dashboard.accentPrimary,
  "--dashboard-accent-light": appTheme.dashboard.accentLight,
  "--dashboard-hover-light": appTheme.dashboard.hoverLight,
  "--dashboard-soft-highlight": appTheme.dashboard.softHighlight,
  "--dashboard-tabs-background": appTheme.dashboard.tabs.background,
  "--dashboard-tabs-active": appTheme.dashboard.tabs.active,
  "--dashboard-tabs-hover": appTheme.dashboard.tabs.hover,
  "--dashboard-cards-background": appTheme.dashboard.cards.background,
  "--dashboard-cards-hover": appTheme.dashboard.cards.hover,
  "--dashboard-cards-border-glow": appTheme.dashboard.cards.borderGlow,
  "--dashboard-buttons-background": appTheme.dashboard.buttons.background,
  "--dashboard-buttons-hover": appTheme.dashboard.buttons.hover,
  "--dashboard-series-1": appTheme.dashboard.series[0],
  "--dashboard-series-2": appTheme.dashboard.series[1],
  "--dashboard-series-3": appTheme.dashboard.series[2],
  "--dashboard-series-4": appTheme.dashboard.series[3],
  "--dashboard-series-5": appTheme.dashboard.series[4],
  "--dashboard-series-6": appTheme.dashboard.series[5],
  "--dashboard-header-gradient": appTheme.dashboard.headerGradient,
};

const lightVariables = {
  "--background": appTheme.light.background,
  "--foreground": appTheme.light.foreground,
  "--card": appTheme.light.card,
  "--card-foreground": appTheme.light.cardForeground,
  "--popover": appTheme.light.popover,
  "--popover-foreground": appTheme.light.popoverForeground,
  "--primary": appTheme.light.primary,
  "--primary-foreground": appTheme.light.primaryForeground,
  "--secondary": appTheme.light.secondary,
  "--secondary-foreground": appTheme.light.secondaryForeground,
  "--muted": appTheme.light.muted,
  "--muted-foreground": appTheme.light.mutedForeground,
  "--accent": appTheme.light.accent,
  "--accent-foreground": appTheme.light.accentForeground,
  "--destructive": appTheme.light.destructive,
  "--destructive-foreground": appTheme.light.destructiveForeground,
  "--border": appTheme.light.border,
  "--input": appTheme.light.input,
  "--ring": appTheme.light.ring,
};

const darkVariables = {
  "--background": appTheme.dark.background,
  "--foreground": appTheme.dark.foreground,
  "--card": appTheme.dark.card,
  "--card-foreground": appTheme.dark.cardForeground,
  "--popover": appTheme.dark.popover,
  "--popover-foreground": appTheme.dark.popoverForeground,
  "--primary": appTheme.dark.primary,
  "--primary-foreground": appTheme.dark.primaryForeground,
  "--secondary": appTheme.dark.secondary,
  "--secondary-foreground": appTheme.dark.secondaryForeground,
  "--muted": appTheme.dark.muted,
  "--muted-foreground": appTheme.dark.mutedForeground,
  "--accent": appTheme.dark.accent,
  "--accent-foreground": appTheme.dark.accentForeground,
  "--destructive": appTheme.dark.destructive,
  "--destructive-foreground": appTheme.dark.destructiveForeground,
  "--border": appTheme.dark.border,
  "--input": appTheme.dark.input,
  "--ring": appTheme.dark.ring,
};

const setVariables = (variables, target) => {
  Object.entries(variables).forEach(([key, value]) => {
    target.style.setProperty(key, value);
  });
};

export const setThemeVariable = (name, value, target = document.documentElement) => {
  const cssName = name.startsWith("--") ? name : `--${name}`;
  target.style.setProperty(cssName, value);
};

export const setThemeVariables = (variables, target = document.documentElement) => {
  setVariables(variables, target);
};

export const applyAppTheme = ({ mode = "light", target = document.documentElement } = {}) => {
  setVariables(cssVariables, target);
  setVariables(mode === "dark" ? darkVariables : lightVariables, target);
  target.dataset.themeMode = mode;
};

export const setAppTheme = (themeOverrides = {}, options = {}) => {
  const target = options.target || document.documentElement;

  if (themeOverrides.cssVariables) {
    setThemeVariables(themeOverrides.cssVariables, target);
  }

  if (themeOverrides.mode) {
    applyAppTheme({ mode: themeOverrides.mode, target });
  }

  return {
    ...appTheme,
    ...themeOverrides,
  };
};

export const appCssVariables = cssVariables;
export const appLightCssVariables = lightVariables;
export const appDarkCssVariables = darkVariables;
