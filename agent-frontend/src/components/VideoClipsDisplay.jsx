import React, { useState } from 'react';

const VideoClipsDisplay = ({ clips, summary, onReset }) => {
  const [sortBy, setSortBy] = useState('confidence'); // 'confidence', 'duration', 'index'
  const [filterByPlatform, setFilterByPlatform] = useState('all');
  const [expandedClip, setExpandedClip] = useState(null);

  // Get unique platforms from all clips for filtering
  const allPlatforms = [...new Set(clips.flatMap(clip => clip.suggested_platforms))];

  // Sort and filter clips
  const filteredAndSortedClips = clips
    .filter(clip => {
      if (filterByPlatform === 'all') return true;
      return clip.suggested_platforms.includes(filterByPlatform);
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence_score - a.confidence_score;
        case 'duration':
          return a.duration_seconds - b.duration_seconds;
        case 'index':
        default:
          return clips.indexOf(a) - clips.indexOf(b);
      }
    });

  const formatTime = (timeStr) => {
    // Handle both MM:SS and HH:MM:SS formats
    const parts = timeStr.split(':');
    if (parts.length === 2) {
      return `${parts[0]}:${parts[1]}`;
    } else if (parts.length === 3) {
      return timeStr;
    }
    return timeStr;
  };

  const getContentTypeColor = (contentType) => {
    const colors = {
      'demo': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      'explanation': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      'tutorial': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
      'insight': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      'comparison': 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200'
    };
    return colors[contentType] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400';
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const copyTimestamp = (startTime, endTime) => {
    const text = `${formatTime(startTime)} - ${formatTime(endTime)}`;
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  if (!clips || clips.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-6xl mx-auto transition-colors duration-300">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎬</div>
          <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            No clips found
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The AI couldn't identify any suitable clips from the video content.
          </p>
          <button
            onClick={onReset}
            className="bg-purple-600 dark:bg-purple-700 hover:bg-purple-700 dark:hover:bg-purple-800 text-white px-6 py-2 rounded-lg transition-colors duration-300"
          >
            Try Another Video
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 max-w-6xl mx-auto transition-colors duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            🎬 Video Clip Analysis Results
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Found {summary.total_clips_found} potential clips • Theme: {summary.overall_video_theme}
          </p>
        </div>
        <button
          onClick={onReset}
          className="mt-4 md:mt-0 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-300"
        >
          Analyze Another Video
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-1 text-sm"
          >
            <option value="confidence">Confidence Score</option>
            <option value="duration">Duration</option>
            <option value="index">Original Order</option>
          </select>
        </div>
        
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by platform:</label>
          <select
            value={filterByPlatform}
            onChange={(e) => setFilterByPlatform(e.target.value)}
            className="bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Platforms</option>
            {allPlatforms.map(platform => (
              <option key={platform} value={platform}>{platform}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Clips List */}
      <div className="space-y-4">
        {filteredAndSortedClips.map((clip, index) => (
          <div
            key={index}
            className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:shadow-md transition-shadow duration-300"
          >
            {/* Clip Header */}
            <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    {clip.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getContentTypeColor(clip.content_type)}`}>
                    {clip.content_type}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <button
                    onClick={() => copyTimestamp(clip.start_time, clip.end_time)}
                    className="flex items-center space-x-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    title="Click to copy timestamp"
                  >
                    <span>⏱️</span>
                    <span>{formatTime(clip.start_time)} - {formatTime(clip.end_time)}</span>
                  </button>
                  
                  <span className="flex items-center space-x-1">
                    <span>⏱</span>
                    <span>{clip.duration_seconds}s</span>
                  </span>
                  
                  <span className={`flex items-center space-x-1 font-medium ${getConfidenceColor(clip.confidence_score)}`}>
                    <span>📊</span>
                    <span>{Math.round(clip.confidence_score * 100)}% confidence</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Clip Content */}
            <div className="mb-3">
              <p className="text-gray-700 dark:text-gray-300 italic mb-2">
                "{clip.hook}"
              </p>
              
              {expandedClip === index && (
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">Why it's engaging:</span>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{clip.why_engaging}</p>
                  </div>
                  
                  {clip.key_topics.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Key topics:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {clip.key_topics.map((topic, i) => (
                          <span key={i} className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {clip.call_to_action && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">Suggested CTA:</span>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">"{clip.call_to_action}"</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Platforms and Actions */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2 mb-2 md:mb-0">
                <span className="text-sm text-gray-600 dark:text-gray-400">Best for:</span>
                {clip.suggested_platforms.map((platform, i) => (
                  <span key={i} className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                    {platform}
                  </span>
                ))}
              </div>
              
              <button
                onClick={() => setExpandedClip(expandedClip === index ? null : index)}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 transition-colors"
              >
                {expandedClip === index ? 'Show Less' : 'Show Details'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Best Clip Highlight */}
      {summary.best_clip_index >= 0 && summary.best_clip_index < clips.length && (
        <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 dark:text-green-200 mb-2">
            🌟 Recommended Best Clip
          </h3>
          <p className="text-green-700 dark:text-green-300">
            <strong>{clips[summary.best_clip_index].title}</strong> - 
            {formatTime(clips[summary.best_clip_index].start_time)} to {formatTime(clips[summary.best_clip_index].end_time)}
          </p>
        </div>
      )}

      {/* Usage Tips */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
          💡 How to use these clips:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
          <li>• Click timestamps to copy them for video editing software</li>
          <li>• Use the platform suggestions to target the right audience</li>
          <li>• Higher confidence scores indicate more engaging content</li>
          <li>• Consider the suggested CTAs for maximum engagement</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoClipsDisplay;