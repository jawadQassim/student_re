import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SchoolDataProvider } from './context/SchoolDataContext';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SchoolDataProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </SchoolDataProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
