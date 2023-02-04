import React from 'react';
import ReactDOM from 'react-dom/client';
// Import global css first, to ensure component-level css-modules gets higher specificity
import './global.css';
import { OfficeSearchApp } from './components/OfficeSearchApp';

ReactDOM.hydrateRoot(
    document.getElementById('app') as HTMLElement,
    <React.StrictMode>
        <OfficeSearchApp />
    </React.StrictMode>
);
