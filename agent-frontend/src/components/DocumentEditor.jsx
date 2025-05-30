import React, { useState, useContext, useRef, useEffect } from 'react';
import { SettingsContext } from './SettingsContext';
import toast from 'react-hot-toast';
import './DocumentPreview.css';

const DocumentEditor = () => {
  const { settings } = useContext(SettingsContext);
  const [activeTab, setActiveTab] = useState('markdown'); // Start with markdown for editing
  const [textContent, setTextContent] = useState('');
  const [wordpressContent, setWordpressContent] = useState('');
  const [markdownContent, setMarkdownContent] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('Normal text');
  const [isAiAssisting, setIsAiAssisting] = useState(false);
  const [saveDropdownOpen, setSaveDropdownOpen] = useState(false);
  const saveDropdownRef = useRef(null);

  const formatOptions = [
    'Normal text',
    'Heading 1',
    'Heading 2', 
    'Heading 3',
    'Heading 4',
    'Heading 5',
    'Heading 6',
    'Code block',
    'Quote',
    'Bullet list',
    'Numbered list'
  ];

  const tabs = [
    { id: 'text', label: 'Preview', icon: '👁️' },
    { id: 'markdown', label: 'Markdown', icon: '📝' },
    { id: 'wordpress', label: 'HTML Source', icon: '🌐' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(event.target)) {
        setSaveDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFormatChange = (format) => {
    setSelectedFormat(format);
    
    // Apply formatting to the current cursor position or selection
    const textarea = document.getElementById('markdown-editor');
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
    let formattedText = '';

    switch (format) {
      case 'Heading 1':
        formattedText = `# ${selectedText || 'Heading 1'}`;
        break;
      case 'Heading 2':
        formattedText = `## ${selectedText || 'Heading 2'}`;
        break;
      case 'Heading 3':
        formattedText = `### ${selectedText || 'Heading 3'}`;
        break;
      case 'Heading 4':
        formattedText = `#### ${selectedText || 'Heading 4'}`;
        break;
      case 'Heading 5':
        formattedText = `##### ${selectedText || 'Heading 5'}`;
        break;
      case 'Heading 6':
        formattedText = `###### ${selectedText || 'Heading 6'}`;
        break;
      case 'Code block':
        formattedText = `\`\`\`\n${selectedText || 'Your code here'}\n\`\`\``;
        break;
      case 'Quote':
        formattedText = `> ${selectedText || 'Your quote here'}`;
        break;
      case 'Bullet list':
        formattedText = `- ${selectedText || 'List item'}`;
        break;
      case 'Numbered list':
        formattedText = `1. ${selectedText || 'List item'}`;
        break;
      default:
        formattedText = selectedText;
    }

    const newContent = markdownContent.substring(0, start) + formattedText + markdownContent.substring(end);
    handleTextChange(newContent);
  };

  const updateOtherFormats = (content) => {
    // Convert markdown to WordPress format (HTML)
    // First, handle code blocks separately to preserve them
    let htmlContent = content;
    
    // Store code blocks temporarily to prevent them from being processed
    const codeBlocks = [];
    const codeBlockPlaceholder = '___CODE_BLOCK_PLACEHOLDER___';
    
    // Extract and store code blocks
    htmlContent = htmlContent.replace(/```([\s\S]*?)```/g, (match, code) => {
      codeBlocks.push(`<pre><code>${code.trim()}</code></pre>`);
      return `${codeBlockPlaceholder}${codeBlocks.length - 1}`;
    });
    
    // Handle lists - this is more complex to get right
    const lines = htmlContent.split('\n');
    let htmlLines = [];
    let inUnorderedList = false;
    let inOrderedList = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isUnorderedItem = /^- (.*)/.test(line);
      const isOrderedItem = /^\d+\. (.*)/.test(line);
      
      if (isUnorderedItem) {
        if (!inUnorderedList) {
          htmlLines.push('<ul>');
          inUnorderedList = true;
        }
        if (inOrderedList) {
          htmlLines.push('</ol>');
          inOrderedList = false;
        }
        const text = line.replace(/^- (.*)/, '$1');
        htmlLines.push(`<li>${text}</li>`);
      } else if (isOrderedItem) {
        if (!inOrderedList) {
          htmlLines.push('<ol>');
          inOrderedList = true;
        }
        if (inUnorderedList) {
          htmlLines.push('</ul>');
          inUnorderedList = false;
        }
        const text = line.replace(/^\d+\. (.*)/, '$1');
        htmlLines.push(`<li>${text}</li>`);
      } else {
        if (inUnorderedList) {
          htmlLines.push('</ul>');
          inUnorderedList = false;
        }
        if (inOrderedList) {
          htmlLines.push('</ol>');
          inOrderedList = false;
        }
        
        // Process non-list lines
        let processedLine = line
          // Handle headings
          .replace(/^# (.*$)/, '<h1>$1</h1>')
          .replace(/^## (.*$)/, '<h2>$1</h2>')
          .replace(/^### (.*$)/, '<h3>$1</h3>')
          .replace(/^#### (.*$)/, '<h4>$1</h4>')
          .replace(/^##### (.*$)/, '<h5>$1</h5>')
          .replace(/^###### (.*$)/, '<h6>$1</h6>')
          
          // Handle inline code (but not code blocks)
          .replace(/`([^`]+)`/g, '<code>$1</code>')
          
          // Handle bold and italic
          .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em>$1</em>')
          
          // Handle links
          .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
          
          // Handle images
          .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
          
          // Handle blockquotes
          .replace(/^> (.*$)/, '<blockquote>$1</blockquote>');
        
        // Add paragraphs for non-empty lines that aren't already wrapped in HTML tags
        if (processedLine.trim() && !processedLine.match(/^<[^>]+>/) && !processedLine.includes(codeBlockPlaceholder)) {
          processedLine = `<p>${processedLine}</p>`;
        }
        
        htmlLines.push(processedLine);
      }
    }
    
    // Close any remaining lists
    if (inUnorderedList) {
      htmlLines.push('</ul>');
    }
    if (inOrderedList) {
      htmlLines.push('</ol>');
    }
    
    let wpContent = htmlLines.join('\n');
    
    // Restore code blocks
    codeBlocks.forEach((codeBlock, index) => {
      wpContent = wpContent.replace(`${codeBlockPlaceholder}${index}`, codeBlock);
    });

    setWordpressContent(wpContent);
    setTextContent(content); // Text content is now the same as markdown for processing
  };

  const handleTextChange = (content) => {
    setMarkdownContent(content);
    updateOtherFormats(content);
  };

  const handleAiAssist = async (instruction) => {
    if (!settings.llmApiKey) {
      toast.error('LLM API key is required for AI assistance. Please check your settings.');
      return;
    }

    setIsAiAssisting(true);

    try {
      const agentApiUrl = settings.llmApiUrl || process.env.REACT_APP_AGENT_API_URL || 'http://localhost:8001';
      const response = await fetch(`${agentApiUrl}/document-assist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: markdownContent,
          instruction: instruction,
          llm_api_key: settings.llmApiKey,
          llm_model: settings.defaultLlmModel,
          llm_base_url: settings.llmBaseUrl
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI assistance request failed: ${errorText}`);
      }

      const data = await response.json();
      handleTextChange(data.revised_content || data.content);
      toast.success('AI assistance applied!');

    } catch (error) {
      console.error('AI assistance error:', error);
      toast.error('Failed to get AI assistance. Please try again.');
    } finally {
      setIsAiAssisting(false);
    }
  };

  const handleSave = () => {
    // For now, download the current active tab's content
    let content, filename, mimeType;
    
    switch (activeTab) {
      case 'wordpress':
        content = wordpressContent || convertToHtml(markdownContent);
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.html`;
        mimeType = 'text/html';
        break;
      case 'markdown':
        content = markdownContent;
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.md`;
        mimeType = 'text/markdown';
        break;
      default: // text (preview)
        content = markdownContent; // Save as markdown even from preview
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.md`;
        mimeType = 'text/markdown';
    }
    
    if (!content.trim()) {
      toast.error('Document is empty. Please add some content before saving.');
      return;
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    toast.success(`Document saved as ${filename}!`);
  };
  
  const handleSaveAs = (format) => {
    let content, filename, mimeType;
    
    switch (format) {
      case 'html':
        content = wordpressContent || convertToHtml(markdownContent);
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.html`;
        mimeType = 'text/html';
        break;
      case 'md':
        content = markdownContent;
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.md`;
        mimeType = 'text/markdown';
        break;
      case 'txt':
      default:
        // Convert markdown to plain text (strip markdown syntax)
        content = markdownContent
          .replace(/^#{1,6}\s+/gm, '') // Remove heading markers
          .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
          .replace(/\*([^*]+)\*/g, '$1') // Remove italic
          .replace(/`([^`]+)`/g, '$1') // Remove inline code
          .replace(/```[\s\S]*?```/g, '') // Remove code blocks
          .replace(/^>\s+/gm, '') // Remove blockquotes
          .replace(/^[-*]\s+/gm, '') // Remove bullet points
          .replace(/^\d+\.\s+/gm, '') // Remove numbered lists
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // Remove links, keep text
        filename = `scribby-document-${new Date().toISOString().slice(0, 10)}.txt`;
        mimeType = 'text/plain';
    }
    
    if (!content.trim()) {
      toast.error('Document is empty. Please add some content before saving.');
      return;
    }
    
    // Create and download the file
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
    
    toast.success(`Document saved as ${filename}!`);
  };
  
  const convertToHtml = (text) => {
    // Basic markdown to HTML conversion if WordPress content is empty
    return text
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^#### (.*$)/gm, '<h4>$1</h4>')
      .replace(/^##### (.*$)/gm, '<h5>$1</h5>')
      .replace(/^###### (.*$)/gm, '<h6>$1</h6>')
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^1\. (.*$)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br>');
  };

  const renderEditor = () => {
    switch (activeTab) {
      case 'text': // Preview Tab - Shows rendered content
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-800 dark:text-blue-200 text-sm">
                <strong>Preview:</strong> This shows how your document will look when rendered. Switch to the Markdown tab to edit.
              </p>
            </div>
            
            {/* Rendered Content Preview */}
            <div 
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 overflow-y-auto document-preview"
              dangerouslySetInnerHTML={{ 
                __html: wordpressContent || '<p style="color: #6b7280; font-style: italic;">Start writing in the Markdown tab to see your content here...</p>' 
              }}
              style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'inherit'
              }}
            />
          </div>
        );

      case 'markdown': // Markdown Tab - Editable source
        return (
          <div className="space-y-4">
            {/* Format Dropdown and AI Assist Buttons */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <select
                  value={selectedFormat}
                  onChange={(e) => handleFormatChange(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pr-10 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors duration-300"
                >
                  {formatOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* AI Assist Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => handleAiAssist('Improve the writing style and clarity of this text')}
                  disabled={isAiAssisting}
                  className="px-3 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-lg hover:bg-purple-700 dark:hover:bg-purple-800 text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAiAssisting ? '🤖 Working...' : '🤖 Improve'}
                </button>
                <button
                  onClick={() => handleAiAssist('Make this text more concise and to the point')}
                  disabled={isAiAssisting}
                  className="px-3 py-2 bg-indigo-600 dark:bg-indigo-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-800 text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  🎯 Summarize
                </button>
                <button
                  onClick={() => handleAiAssist('Expand on this text with more details and examples')}
                  disabled={isAiAssisting}
                  className="px-3 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  📈 Expand
                </button>
              </div>
            </div>

            {/* Markdown Editor */}
            <textarea
              id="markdown-editor"
              value={markdownContent}
              onChange={(e) => handleTextChange(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors duration-300 resize-none font-mono text-sm"
              placeholder="Start writing your document here...\n\nExamples:\n# Heading 1\n## Heading 2\n**Bold text**\n*Italic text*\n- Bullet point\n1. Numbered list\n> Quote\n\n```\nCode block\n```"
            />
          </div>
        );

      case 'wordpress': // HTML Source Tab - Read-only HTML
        return (
          <div className="space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-green-800 dark:text-green-200 text-sm">
                <strong>HTML Source:</strong> This shows the raw HTML code that will be generated. You can copy this for use in WordPress or other systems.
              </p>
            </div>
            <textarea
              value={wordpressContent}
              onChange={(e) => setWordpressContent(e.target.value)}
              className="w-full h-96 p-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 transition-colors duration-300 resize-none font-mono text-sm"
              placeholder="HTML content will appear here when you write in the Markdown tab..."
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg transition-colors duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Document Editor</h2>
        
        {/* Save Button Group */}
        <div className="relative" ref={saveDropdownRef}>
          <div className="flex">
            {/* Main Save Button */}
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-l-lg hover:bg-purple-700 dark:hover:bg-purple-800 font-medium transition-colors duration-300 shadow-md hover:shadow-lg flex items-center space-x-2"
            >
              <span>💾</span>
              <span>Save</span>
            </button>
            
            {/* Dropdown Toggle Button */}
            <button
              onClick={() => setSaveDropdownOpen(!saveDropdownOpen)}
              className="px-3 py-2 bg-purple-600 dark:bg-purple-700 text-white rounded-r-lg hover:bg-purple-700 dark:hover:bg-purple-800 font-medium transition-colors duration-300 shadow-md hover:shadow-lg border-l border-purple-500 dark:border-purple-600"
              aria-label="Save options"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
          
          {/* Dropdown Menu */}
          {saveDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-10">
              <div className="py-1">
                <div className="px-4 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  Save As:
                </div>
                <button
                  onClick={() => {
                    handleSaveAs('txt');
                    setSaveDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>📄</span>
                  <span>Text File (.txt)</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveAs('html');
                    setSaveDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>🌐</span>
                  <span>WordPress (.html)</span>
                </button>
                <button
                  onClick={() => {
                    handleSaveAs('md');
                    setSaveDropdownOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200 flex items-center space-x-2"
                >
                  <span>📝</span>
                  <span>Markdown (.md)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 py-3 px-6 font-medium transition-colors duration-300 border-b-2 ${
              activeTab === tab.id
                ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Editor Content */}
      {renderEditor()}

      {/* Character Count */}
      <div className="mt-4 flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
        <div>
          Characters: {markdownContent.length} | Words: {markdownContent.split(/\s+/).filter(word => word.length > 0).length}
        </div>
        <div className="text-xs">
          💡 Click Save to download your document
        </div>
      </div>
    </div>
  );
};

export default DocumentEditor;