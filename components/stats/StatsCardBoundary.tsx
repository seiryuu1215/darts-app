'use client';

import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import { Alert, AlertTitle, Box } from '@mui/material';

interface Props {
  /** カード名（エラー表示用） */
  name: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * スタッツカード単位のエラーバウンダリ。
 * 1枚のカードがクラッシュしても他のカードは正常に表示し続ける。
 */
export default class StatsCardBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[StatsCardBoundary] ${this.props.name}:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ mb: 2 }}>
          <Alert severity="warning" variant="outlined" sx={{ borderRadius: 2 }}>
            <AlertTitle sx={{ fontSize: 13 }}>{this.props.name}</AlertTitle>
            このカードの表示中にエラーが発生しました
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
