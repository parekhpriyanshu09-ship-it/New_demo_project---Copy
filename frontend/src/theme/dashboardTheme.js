import { appTheme } from "./appTheme";

export const dashboardTheme = appTheme.dashboard;

export const dashboardCssVariables = `
  --dashboard-text: ${dashboardTheme.text};
  --dashboard-primary-deep: ${dashboardTheme.primaryDeep};
  --dashboard-secondary: ${dashboardTheme.secondary};
  --dashboard-accent-primary: ${dashboardTheme.accentPrimary};
  --dashboard-accent-light: ${dashboardTheme.accentLight};
  --dashboard-hover-light: ${dashboardTheme.hoverLight};
  --dashboard-soft-highlight: ${dashboardTheme.softHighlight};
  --dashboard-tabs-background: ${dashboardTheme.tabs.background};
  --dashboard-tabs-active: ${dashboardTheme.tabs.active};
  --dashboard-tabs-hover: ${dashboardTheme.tabs.hover};
  --dashboard-cards-background: ${dashboardTheme.cards.background};
  --dashboard-cards-hover: ${dashboardTheme.cards.hover};
  --dashboard-cards-border-glow: ${dashboardTheme.cards.borderGlow};
  --dashboard-buttons-background: ${dashboardTheme.buttons.background};
  --dashboard-buttons-hover: ${dashboardTheme.buttons.hover};
  --dashboard-series-1: ${dashboardTheme.series[0]};
  --dashboard-series-2: ${dashboardTheme.series[1]};
  --dashboard-series-3: ${dashboardTheme.series[2]};
  --dashboard-series-4: ${dashboardTheme.series[3]};
  --dashboard-series-5: ${dashboardTheme.series[4]};
  --dashboard-series-6: ${dashboardTheme.series[5]};
  --dashboard-header-gradient: ${dashboardTheme.headerGradient};
`;
