import React from 'react';
import * as Lucide from 'lucide-react';

const Icon = ({ name, size, color = 'currentColor', className = '', ...rest }) => {
  try {
    // Assicurati che size sia un numero valido
    const iconSize = Number(size) || 24;

    // Se name è già un componente React (elemento o forward_ref)
    if (React.isValidElement(name)) {
      // Se è un elemento React, clonarlo con le nuove props
      return React.cloneElement(name, {
        size: iconSize,
        color,
        className: `${name.props.className || ''} inline-block ${className}`.trim(),
        'aria-hidden': 'true',
        ...rest
      });
    } else if (typeof name === 'function' && name.$$typeof === Symbol.for('react.forward_ref')) {
      // Se è una funzione forward_ref, crearla con createElement
      return React.createElement(name, {
        size: iconSize,
        color,
        className: `inline-block ${className}`.trim(),
        'aria-hidden': 'true',
        ...rest
      });
    }

    // Se name è una stringa, cerca il componente in Lucide
    if (typeof name === 'string' && Lucide[name]) {
      return React.createElement(Lucide[name], {
        size: iconSize,
        color,
        className: `inline-block ${className}`.trim(),
        'aria-hidden': 'true',
        ...rest
      });
    }

    // Fallback a HelpCircle se l'icona non viene trovata
    console.warn(`Icon "${name}" not found, using fallback icon (HelpCircle)`);
    return React.createElement(Lucide.HelpCircle, {
      size: iconSize,
      color,
      className: `inline-block ${className}`.trim(),
      'aria-hidden': 'true',
      ...rest
    });
  } catch (error) {
    console.error(`Error rendering icon:`, error);
    // Fallback in caso di errore
    return React.createElement(Lucide.AlertTriangle, {
      size: 24,
      color: 'red',
      className: `inline-block ${className}`.trim(),
      'aria-hidden': 'true',
      title: 'Error rendering icon',
      ...rest
    });
  }
};

export default Icon;
