import type { Preview, ReactRenderer } from '@storybook/nextjs-vite';
import { withThemeFromJSXProvider } from '@storybook/addon-themes';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { transition: 'box-shadow 0.2s ease, transform 0.2s ease' },
      },
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: { transition: 'box-shadow 0.2s ease, transform 0.2s ease' },
      },
    },
  },
});

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    a11y: {
      test: 'todo',
    },
    layout: 'padded',
  },
  decorators: [
    withThemeFromJSXProvider<ReactRenderer>({
      themes: {
        dark: darkTheme,
        light: lightTheme,
      },
      defaultTheme: 'dark',
      Provider: ThemeProvider,
      GlobalStyles: CssBaseline,
    }),
  ],
};

export default preview;
