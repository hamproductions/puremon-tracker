import { Component, type ReactNode } from 'react';
import { Stack } from 'styled-system/jsx';

interface State {
  error?: Error;
}

export default class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = {};

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <Stack gap="2" justifyContent="center" alignItems="center" minH="50vh" p="6">
          <p style={{ fontWeight: 700 }}>エラーが発生しました</p>
          <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>{this.state.error.message}</p>
        </Stack>
      );
    }
    return this.props.children;
  }
}
