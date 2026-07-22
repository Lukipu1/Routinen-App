import React from 'react';

import { resolveIcon } from '../../constants/icons';
import { useTheme } from '../../theme/ThemeProvider';

interface IconProps {
  name: string | undefined;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

/** Resolves an icon key to a Lucide component, themed by default. */
export function Icon({ name, size = 24, color, strokeWidth = 2 }: IconProps): React.ReactElement {
  const theme = useTheme();
  const LucideComponent = resolveIcon(name);
  return (
    <LucideComponent
      size={size}
      color={color ?? theme.colors.primaryText}
      strokeWidth={strokeWidth}
    />
  );
}
