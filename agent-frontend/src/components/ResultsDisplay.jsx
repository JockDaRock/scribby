import React, { useState } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import toast from 'react-hot-toast';

// Social media platform icons
const PlatformIcon = ({ platform }) => {
  const iconClasses = "h-6 w-6";
  
  switch (platform) {
    case 'LinkedIn':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'Twitter':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'BlueSky':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12,22 C17.5228475,22 22,17.5228475 22,12 C22,6.4771525 17.5228475,2 12,2 C6.4771525,2 2,6.4771525 2,12 C2,17.5228475 6.4771525,22 12,22 Z M7.5,10.5 C8.32842712,10.5 9,11.1715729 9,12 C9,12.8284271 8.32842712,13.5 7.5,13.5 C6.67157288,13.5 6,12.8284271 6,12 C6,11.1715729 6.67157288,10.5 7.5,10.5 Z M16.5,10.5 C17.3284271,10.5 18,11.1715729 18,12 C18,12.8284271 17.3284271,13.5 16.5,13.5 C15.6715729,13.5 15,12.8284271 15,12 C15,11.1715729 15.6715729,10.5 16.5,10.5 Z M12,17 C9.75,17 8,15.75 8,15.75 C8,15.75 9.75,17.5 12,17.5 C14.25,17.5 16,15.75 16,15.75 C16,15.75 14.25,17 12,17 Z" />
        </svg>
      );
    case 'Instagram':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      );
    case 'Facebook':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'TikTok':
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
        </svg>
      );
    default:
      return (
        <svg className={iconClasses} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
        </svg>
      );
  }
};

// Content Card component
const ContentCard = ({ platform, content }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(content.text);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    setIsCopied(true);
    toast.success(`Copied ${platform} content to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    // Calculate new character count
    const charCount = editedText.length;
    content.text = editedText;
    content.character_count = charCount;
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(content.text);
  };
  
  const handleChange = (e) => {
    setEditedText(e.target.value);
  };
  
  // Platform-specific styles (with dark mode variants)
  const platformStyles = {
    LinkedIn: 'bg-blue-100 border-blue-300 text-blue-800 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-200',
    Twitter: 'bg-sky-100 border-sky-300 text-sky-800 dark:bg-sky-900/30 dark:border-sky-800 dark:text-sky-200',
    BlueSky: 'bg-cyan-100 border-cyan-300 text-cyan-800 dark:bg-cyan-900/30 dark:border-cyan-800 dark:text-cyan-200',
    Instagram: 'bg-pink-100 border-pink-300 text-pink-800 dark:bg-pink-900/30 dark:border-pink-800 dark:text-pink-200',
    Facebook: 'bg-indigo-100 border-indigo-300 text-indigo-800 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-200',
    TikTok: 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200',
  };
  
  const style = platformStyles[platform] || 'bg-gray-100 border-gray-300 text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200';
  
  // Get platform character limit
  const getCharLimit = (platform) => {
    const limits = {
      LinkedIn: 3000,
      Twitter: 280,
      BlueSky: 300,
      Instagram: 2200,
      Facebook: 63206,
      TikTok: 2200,
    };
    return limits[platform] || 1000;
  };
  
  const charLimit = getCharLimit(platform);
  const charCount = isEditing ? editedText.length : content.character_count;
  const isOverLimit = charCount > charLimit;
  
  return (
    <div className={`rounded-lg border p-4 mb-6 transition-colors duration-300 ${style}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <span className="mr-2 text-gray-700 dark:text-gray-300">
            <PlatformIcon platform={platform} />
          </span>
          <h3 className="font-bold text-lg">{platform}</h3>
        </div>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium transition-colors duration-300"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-800 text-sm font-medium transition-colors duration-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-800 text-sm font-medium transition-colors duration-300"
              >
                Edit
              </button>
              <CopyToClipboard text={content.text} onCopy={handleCopy}>
                <button
                  className={`px-3 py-1 ${
                    isCopied 
                      ? 'bg-green-600 dark:bg-green-700' 
                      : 'bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800'
                  } text-white rounded text-sm font-medium transition-colors duration-300`}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </CopyToClipboard>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={handleChange}
            className={`w-full p-2 border rounded dark:bg-gray-700 dark:text-white transition-colors duration-300 ${
              isOverLimit ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
            }`}
            rows="6"
          />
        ) : (
          <div className="whitespace-pre-wrap">{content.text}</div>
        )}
      </div>
      
      <div className={`text-xs flex justify-between transition-colors duration-300 ${isOverLimit ? 'text-red-600 dark:text-red-400 font-bold' : 'text-gray-500 dark:text-gray-400'}`}>
        <span>Character count: {charCount}</span>
        <span>Limit: {charLimit}</span>
      </div>
    </div>
  );
};

// Blog Display Component
const BlogCard = ({ blogContent }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(blogContent.text);
  const [isCopied, setIsCopied] = useState(false);
  
  const handleCopy = () => {
    setIsCopied(true);
    toast.success(`Copied blog content to clipboard!`);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleSave = () => {
    setIsEditing(false);
    blogContent.text = editedText;
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedText(blogContent.text);
  };
  
  const handleChange = (e) => {
    setEditedText(e.target.value);
  };
  
  return (
    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 p-4 mb-6 bg-indigo-50 dark:bg-indigo-900/20 transition-colors duration-300 dark:text-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-lg text-indigo-800 dark:text-indigo-300">Blog Post</h3>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button
                onClick={handleSave}
                className="px-3 py-1 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 text-sm font-medium transition-colors duration-300"
              >
                Save
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-800 text-sm font-medium transition-colors duration-300"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleEdit}
                className="px-3 py-1 bg-gray-600 dark:bg-gray-700 text-white rounded hover:bg-gray-700 dark:hover:bg-gray-800 text-sm font-medium transition-colors duration-300"
              >
                Edit
              </button>
              <CopyToClipboard text={blogContent.text} onCopy={handleCopy}>
                <button
                  className={`px-3 py-1 ${
                    isCopied 
                      ? 'bg-green-600 dark:bg-green-700' 
                      : 'bg-indigo-600 dark:bg-purple-700 hover:bg-indigo-700 dark:hover:bg-purple-800'
                  } text-white rounded text-sm font-medium transition-colors duration-300`}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </CopyToClipboard>
            </>
          )}
        </div>
      </div>
      
      <div className="mb-3">
        {isEditing ? (
          <textarea
            value={editedText}
            onChange={handleChange}
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white transition-colors duration-300 border-gray-300 dark:border-gray-600"
            rows="15"
          />
        ) : (
          <div className="prose prose-indigo dark:prose-invert dark:text-gray-200 max-w-none whitespace-pre-wrap">
            {blogContent.text}
          </div>
        )}
      </div>
    </div>
  );
};

const ResultsDisplay = ({ results, onReset }) => {
  const [activeTab, setActiveTab] = useState('content');  // Changed default tab name from 'posts' to 'content'
  
  // Add console log to inspect the results structure
  console.log('Results data:', results);
  
  if (!results || (results.content_type === 'social_media' && !results.content) || (results.content_type === 'blog' && !results.blog_content)) {
    return (
      <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg transition-colors duration-300">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Results</h2>
        <p className="text-center text-gray-600 dark:text-gray-300">No results available.</p>
        <div className="flex justify-center mt-6">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-indigo-600 dark:bg-purple-700 text-white rounded hover:bg-indigo-700 dark:hover:bg-purple-800 transition-colors duration-300"
          >
            Start Over
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md dark:shadow-lg transition-colors duration-300">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800 dark:text-white">Generated Content</h2>
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6 transition-colors duration-300">
        <button
          className={`py-2 px-4 font-medium transition-colors duration-300 ${
            activeTab === 'content'
              ? 'text-indigo-600 dark:text-purple-400 border-b-2 border-indigo-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('content')}
        >
          {results.content_type === 'blog' ? 'Blog Post' : 'Social Media Posts'}
        </button>
        <button
          className={`py-2 px-4 font-medium transition-colors duration-300 ${
            activeTab === 'transcript'
              ? 'text-indigo-600 dark:text-purple-400 border-b-2 border-indigo-600 dark:border-purple-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('transcript')}
        >
          Transcript
        </button>
      </div>
      
      {/* Content */}
      {activeTab === 'content' ? (
        <div>
          {results.content_type === 'blog' ? (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center transition-colors duration-300">
                Here is your generated blog post. You can edit it as needed before copying.
              </p>
              <BlogCard blogContent={results.blog_content} />
            </>
          ) : (
            <>
              <p className="text-gray-600 dark:text-gray-300 mb-6 text-center transition-colors duration-300">
                Here are your generated social media posts. You can edit them as needed before copying.
              </p>
              
              {Object.entries(results.content).map(([platform, content]) => (
                <ContentCard key={platform} platform={platform} content={content} />
              ))}
            </>
          )}
        </div>
      ) : (
        <div>
          <p className="text-gray-600 dark:text-gray-300 mb-4 transition-colors duration-300">Original Transcript:</p>
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border border-gray-200 dark:border-gray-600 mb-6 max-h-96 overflow-y-auto transition-colors duration-300">
            <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200">{results.transcript}</pre>
          </div>
        </div>
      )}
      
      <div className="flex justify-center mt-6">
        <button
          onClick={onReset}
          className="px-6 py-2 bg-indigo-600 dark:bg-purple-700 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-purple-800 font-medium transition-all duration-300 shadow-md dark:shadow-lg hover:shadow-lg dark:hover:shadow-xl"
        >
          Create New Content
        </button>
      </div>
    </div>
  );
};

export default ResultsDisplay;