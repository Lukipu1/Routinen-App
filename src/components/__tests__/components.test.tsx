import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';

import { EmptyState } from '../common/EmptyState';
import { StatusBadge } from '../common/StatusBadge';
import { ThemeProvider } from '../../theme/ThemeProvider';

function renderThemed(ui: React.ReactElement) {
  return render(<ThemeProvider preference="light">{ui}</ThemeProvider>);
}

describe('StatusBadge', () => {
  it('renders a German label for the status', () => {
    renderThemed(<StatusBadge status="completed" />);
    expect(screen.getByText('Erledigt')).toBeTruthy();
  });

  it('shows a neutral label for a missed routine', () => {
    renderThemed(<StatusBadge status="missed" />);
    expect(screen.getByText('Verpasst')).toBeTruthy();
  });
});

describe('EmptyState', () => {
  it('renders title/message and fires the action', () => {
    const onAction = jest.fn();
    renderThemed(
      <EmptyState
        icon="sparkles"
        title="Dein Tag ist noch frei"
        message="Plane deine erste Routine."
        actionLabel="Erste Routine planen"
        onAction={onAction}
      />,
    );
    expect(screen.getByText('Dein Tag ist noch frei')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Erste Routine planen'));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
