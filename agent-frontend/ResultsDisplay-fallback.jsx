import React, { useState, useContext } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { SettingsContext } from './SettingsContext';
import { ThemeContext } from './ThemeContext';

// Simple inline styles for syntax highlighting (fallback)
const lightCodeStyle = {
  fontSize: '0.875rem',
  backgroundColor: '#f8f9fa',
  color: '#212529',
  padding: '1rem',
  borderRadius: '0.375rem',
  border: '1px solid #e9ecef',
  overflow: 'auto',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace'
};

const darkCodeStyle = {
  fontSize: '0.875rem',
  backgroundColor: '#1e1e1e',
  color: '#d4d4d4',
  padding: '1rem',
  borderRadius: '0.375rem',
  border: '1px solid #374151',
  overflow: 'auto',
  fontFamily: 'Consolas, Monaco, "Courier New", monospace'
};

// Utility function to detect if content contains markdown
const containsMarkdown = (text) => {
  if (!text) return false;
  // Check for common markdown patterns
  const markdownPatterns = [
    /```[\s\S]*?```/, // Code blocks
    /`[^`]+`/, // Inline code
    /^#{1,6}\s/, // Headers
    /\*\*[^*]+\*\*/, // Bold
    /\*[^*]+\*/, // Italic
    /^[-*+]\s/, // Lists
    /^\d+\.\s/, // Numbered lists
    /\[.*?\]\(.*?\)/, // Links
  ];
  
  return markdownPatterns.some(pattern => pattern.test(text));
};

// Enhanced markdown renderer component
const MarkdownRenderer = ({ content, className = '' }) => {
  const { darkMode } = useContext(ThemeContext);
  
  const components = {
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const language = match ? match[1] : '';
      
      return !inline && match ? (
        <SyntaxHighlighter
          style={darkMode ? darkCodeStyle : lightCodeStyle}
          language={language}
          PreTag="div"
          className="rounded-md my-2"
          customStyle={darkMode ? darkCodeStyle : lightCodeStyle}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      ) : (
        <code
          className={`px-1.5 py-0.5 rounded text-sm font-mono ${
            darkMode 
              ? 'bg-gray-700 text-gray-200' 
              : 'bg-gray-100 text-gray-800'
          }`}
          {...props}
        >
          {children}
        </code>
      );
    },
    // Style other markdown elements
    h1: ({ children }) => (
      <h1 className="text-2xl font-bold my-4 text-gray-800 dark:text-gray-200">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-xl font-bold my-3 text-gray-800 dark:text-gray-200">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-lg font-bold my-2 text-gray-800 dark:text-gray-200">
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="my-2 text-gray-700 dark:text-gray-300">
        {children}
      </p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside my-2 text-gray-700 dark:text-gray-300">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside my-2 text-gray-700 dark:text-gray-300">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="my-1">{children}</li>
    ),
    strong: ({ children }) => (
      <strong className="font-bold text-gray-800 dark:text-gray-200">
        {children}
      </strong>
    ),
    em: ({ children }) => (
      <em className="italic text-gray-800 dark:text-gray-200">
        {children}
      </em>
    ),
    blockquote: ({ children }) => (
      <blockquote className={`border-l-4 pl-4 my-4 italic ${
        darkMode 
          ? 'border-gray-600 text-gray-300' 
          : 'border-gray-300 text-gray-600'
      }`}>
        {children}
      </blockquote>
    ),
  };
  
  return (
    <div className={`markdown-content ${className}`}>
      <ReactMarkdown components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
};

// [Rest of the component code would continue here - this is just the top part with the fixed imports]
