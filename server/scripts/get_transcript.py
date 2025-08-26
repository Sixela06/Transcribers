#!/usr/bin/env python3
# get_transcript.py - Python script to extract YouTube transcripts
# Called by Node.js with video ID as argument

import sys
import json
from youtube_transcript_api import YouTubeTranscriptApi

def extract_transcript(video_id):
    """Extract transcript for given video ID"""
    try:
        # Create API instance
        ytt_api = YouTubeTranscriptApi()
        
        # Try to fetch transcript with language preferences
        languages = ['en', 'en-US', 'en-GB']  # English preferences
        
        try:
            # Try with preferred languages first
            fetched_transcript = ytt_api.fetch(video_id, languages=languages)
        except:
            # Fall back to any available language
            fetched_transcript = ytt_api.fetch(video_id)
        
        # Convert to text
        transcript_text = ' '.join(snippet.text for snippet in fetched_transcript)
        
        # Clean up whitespace
        transcript_text = ' '.join(transcript_text.split())
        
        return {
            'success': True,
            'transcript': transcript_text,
            'language': fetched_transcript.language_code,
            'language_name': fetched_transcript.language,
            'is_generated': fetched_transcript.is_generated,
            'segment_count': len(fetched_transcript),
            'video_id': video_id
        }
        
    except Exception as e:
        error_msg = str(e).lower()
        
        # Provide specific error types for better handling
        if 'no transcript' in error_msg or 'transcript not available' in error_msg:
            error_type = 'NO_TRANSCRIPT'
        elif 'video not found' in error_msg or 'unavailable' in error_msg:
            error_type = 'VIDEO_NOT_FOUND'
        elif 'disabled' in error_msg:
            error_type = 'TRANSCRIPTS_DISABLED'
        else:
            error_type = 'UNKNOWN_ERROR'
        
        return {
            'success': False,
            'error': str(e),
            'error_type': error_type,
            'video_id': video_id
        }

def main():
    """Main function - called from Node.js"""
    if len(sys.argv) < 2:
        result = {
            'success': False,
            'error': 'Video ID argument required',
            'error_type': 'INVALID_ARGUMENTS'
        }
    else:
        video_id = sys.argv[1]
        result = extract_transcript(video_id)
    
    # Output JSON result to stdout for Node.js to parse
    print(json.dumps(result))

if __name__ == "__main__":
    main()