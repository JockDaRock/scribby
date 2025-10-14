/**
 * InteractiveTranscript Component
 * Displays transcription with clickable timestamps
 * Highlights current segment based on playback time
 * Based on Xenova whisper-speaker-diarization but without speaker diarization
 */

import React, { useRef, useEffect } from 'react';

const InteractiveTranscript = ({ segments, currentTime, onTimestampClick }) => {
  const transcriptRef = useRef(null);
  const activeSegmentRef = useRef(null);

  // Auto-scroll to active segment
  useEffect(() => {
    if (activeSegmentRef.current && transcriptRef.current) {
      const container = transcriptRef.current;
      const element = activeSegmentRef.current;
      
      const containerTop = container.scrollTop;
      const containerBottom = containerTop + container.clientHeight;
      const elementTop = element.offsetTop;
      const elementBottom = elementTop + element.clientHeight;

      // Scroll if element is not fully visible
      if (elementTop < containerTop || elementBottom > containerBottom) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentTime]);

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (start, end) => {
    return `${formatTime(start)} → ${formatTime(end)}`;
  };

  const isSegmentActive = (segment) => {
    return currentTime >= segment.start && currentTime < segment.end;
  };

  if (!segments || segments.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <div className="text-6xl mb-4">📝</div>
        <p className="text-lg">No transcription yet. Upload a file and click "Run model" to begin.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Transcript
        </h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {segments.length} segment{segments.length !== 1 ? 's' : ''}
        </div>
      </div>

      <div 
        ref={transcriptRef}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-h-[600px] overflow-y-auto space-y-4"
      >
        {segments.map((segment, index) => {
          const isActive = isSegmentActive(segment);
          
          return (
            <div
              key={index}
              ref={isActive ? activeSegmentRef : null}
              className={`
                p-4 rounded-lg transition-all duration-200 cursor-pointer
                ${isActive 
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-l-4 border-purple-600 shadow-md' 
                  : 'bg-gray-50 dark:bg-gray-700/50 border-l-4 border-transparent hover:border-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }
              `}
              onClick={() => onTimestampClick && onTimestampClick(segment.start)}
            >
              <div className="flex items-start justify-between mb-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTimestampClick && onTimestampClick(segment.start);
                  }}
                  className={`
                    text-sm font-mono font-semibold transition-colors
                    ${isActive 
                      ? 'text-purple-700 dark:text-purple-300' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400'
                    }
                  `}
                >
                  {formatTimestamp(segment.start, segment.end)}
                </button>
                
                {isActive && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white">
                    Playing
                  </span>
                )}
              </div>

              <p className={`
                text-base leading-relaxed
                ${isActive 
                  ? 'text-gray-900 dark:text-white font-medium' 
                  : 'text-gray-700 dark:text-gray-300'
                }
              `}>
                {segment.text}
              </p>
            </div>
          );
        })}
      </div>

      {/* Download Button */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => {
            const text = segments
              .map(seg => `[${formatTimestamp(seg.start, seg.end)}]\n${seg.text}`)
              .join('\n\n');
            
            const blob = new Blob([text], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transcript.txt';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
          className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors shadow-lg"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Download transcript
        </button>
      </div>
    </div>
  );
};

export default InteractiveTranscript;