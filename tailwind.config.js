/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Abilita la modalità dark basata su classe
  theme: {
    extend: {
      colors: {
        // Colori personalizzati per il tema chiaro
        'light-primary': '#6D28D9', // Viola principale
        'light-secondary': '#EDE9FE', // Sfondo viola chiaro per elementi attivi
        'light-accent': '#A78BFA', // Viola più chiaro per accenti
        'light-text': '#1F2937', // Testo scuro su sfondo chiaro
        'light-bg': '#F9FAFB',    // Sfondo principale chiaro (leggermente grigio)
        'light-card': '#FFFFFF',  // Sfondo delle card
        'light-border': '#E5E7EB', // Bordi chiari

        // Colori personalizzati per il tema scuro (già presenti o da affinare)
        'dark-primary': '#8B5CF6', // Viola principale per tema scuro
        'dark-secondary': '#3730A3', // Sfondo viola scuro per elementi attivi
        'dark-accent': '#A78BFA', // Viola per accenti (può essere lo stesso)
        'dark-text': '#F3F4F6',    // Testo chiaro su sfondo scuro
        'dark-bg': '#111827',     // Sfondo principale scuro
        'dark-card': '#1F2937',   // Sfondo delle card scuro
        'dark-border': '#374151',  // Bordi scuri
        'dark-input': '#2D3748', // Sfondo per input in modalità scura
      },
      // Aggiungi qui altre personalizzazioni del tema se necessario
    },
  },
  plugins: [],
}
  