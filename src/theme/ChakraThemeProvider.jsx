import React, { useEffect } from 'react';
import { ChakraProvider, useColorMode } from '@chakra-ui/react';
import chakraTheme from './chakraTheme';

// Componente interno che gestisce la sincronizzazione del tema
const ThemeSync = ({ children }) => {
  const { colorMode, setColorMode } = useColorMode();

  useEffect(() => {
    // Ascolta i cambiamenti del tema dal DOM
    const updateColorMode = () => {
      const isDark = document.documentElement.classList.contains('dark');
      const targetColorMode = isDark ? 'dark' : 'light';
      
      if (colorMode !== targetColorMode) {
        setColorMode(targetColorMode);
      }
    };

    // Controlla inizialmente
    updateColorMode();

    // Osserva i cambiamenti della classe 'dark' sul documento
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateColorMode();
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, [colorMode, setColorMode]);

  return children;
};

// Provider principale che include il tema e la sincronizzazione
const ChakraThemeProvider = ({ children }) => {
  return (
    <ChakraProvider theme={chakraTheme}>
      <ThemeSync>
        {children}
      </ThemeSync>
    </ChakraProvider>
  );
};

export default ChakraThemeProvider;