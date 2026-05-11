import * as React from "react";

export type ChartConfig = Record<
  string,
  {
    label?: string;
    icon?: React.ElementType;
    theme?: Record<string, string | string[]>;
    colors?: Record<string, string[]>;
  }
>;