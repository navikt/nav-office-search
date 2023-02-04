import 'preact/debug';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OfficeSearchApp } from './components/OfficeSearchApp';

export const render = () => {
    return renderToString(<OfficeSearchApp />);
};
