/*  Piccole funzioni di utilità  */

/** Ritorna una data in DD/MM/YYYY */
export const formatDate = (date) =>
    new Date(date).toLocaleDateString('it-IT');
  
  /** Prima lettera maiuscola */
  export const capitalize = (txt = '') =>
    txt.charAt(0).toUpperCase() + txt.slice(1);
  
  /** Somma gli importi di un array di oggetti { amount } */
  export const sumAmounts = (arr = []) =>
    arr.reduce((tot, el) => tot + (Number(el.amount) || 0), 0);
  