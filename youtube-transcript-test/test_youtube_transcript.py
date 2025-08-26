# correct_test.py - Using the proper API from documentation

from youtube_transcript_api import YouTubeTranscriptApi

def test_correct_api():
    print("Testing youtube-transcript-api with correct instantiation")
    
    # Create instance (as shown in documentation)
    ytt_api = YouTubeTranscriptApi()
    
    video_id = 'dQw4w9WgXcQ'  # Rick Roll
    print(f"Testing video: {video_id}")
    
    try:
        # Method 1: Basic fetch (English by default)
        print("\n1. Testing basic fetch()...")
        fetched_transcript = ytt_api.fetch(video_id)
        
        print(f"SUCCESS: Retrieved transcript")
        print(f"Video ID: {fetched_transcript.video_id}")
        print(f"Language: {fetched_transcript.language}")
        print(f"Language Code: {fetched_transcript.language_code}")
        print(f"Is Generated: {fetched_transcript.is_generated}")
        print(f"Snippet Count: {len(fetched_transcript)}")
        
        # Show sample snippets
        print("\n2. Sample snippets:")
        for i, snippet in enumerate(fetched_transcript[:5]):
            print(f"   {i+1}. [{snippet.start:.1f}s] \"{snippet.text}\"")
        
        # Convert to raw data
        print("\n3. Converting to raw data...")
        raw_data = fetched_transcript.to_raw_data()
        print(f"Raw data type: {type(raw_data)}")
        print(f"First raw entry: {raw_data[0]}")
        
        # Combine all text
        full_text = ' '.join(snippet.text for snippet in fetched_transcript)
        print(f"\n4. Full transcript:")
        print(f"   Length: {len(full_text)} characters")
        print(f"   Preview: \"{full_text[:200]}...\"")
        
        return True, full_text
        
    except Exception as e:
        print(f"Basic fetch failed: {e}")
        return False, None

def test_list_transcripts():
    """Test listing available transcripts"""
    print("\n" + "="*50)
    print("TESTING LIST FUNCTIONALITY")
    print("="*50)
    
    ytt_api = YouTubeTranscriptApi()
    video_id = 'dQw4w9WgXcQ'
    
    try:
        print(f"Listing transcripts for {video_id}...")
        transcript_list = ytt_api.list(video_id)
        
        print("Available transcripts:")
        for transcript in transcript_list:
            print(f"  - {transcript.language} ({transcript.language_code})")
            print(f"    Generated: {transcript.is_generated}")
            print(f"    Translatable: {transcript.is_translatable}")
        
        # Try to find English transcript specifically  
        try:
            transcript = transcript_list.find_transcript(['en'])
            fetched = transcript.fetch()
            print(f"\nFound English transcript with {len(fetched)} snippets")
            return True
        except Exception as e:
            print(f"Could not find English transcript: {e}")
            return False
            
    except Exception as e:
        print(f"List function failed: {e}")
        return False

def test_multiple_languages():
    """Test fetching with multiple language preferences"""
    print("\n" + "="*50) 
    print("TESTING MULTIPLE LANGUAGES")
    print("="*50)
    
    ytt_api = YouTubeTranscriptApi()
    video_id = 'dQw4w9WgXcQ'
    
    try:
        # Try multiple languages in priority order
        print("Testing language priority: ['en', 'de', 'es']...")
        fetched_transcript = ytt_api.fetch(video_id, languages=['en', 'de', 'es'])
        
        print(f"Retrieved: {fetched_transcript.language} ({fetched_transcript.language_code})")
        print(f"Snippets: {len(fetched_transcript)}")
        
        return True
        
    except Exception as e:
        print(f"Multi-language test failed: {e}")
        return False

def test_multiple_videos():
    """Test different videos to see success rate"""
    print("\n" + "="*50)
    print("TESTING MULTIPLE VIDEOS")  
    print("="*50)
    
    test_videos = [
        {'id': 'dQw4w9WgXcQ', 'name': 'Rick Roll'},
        {'id': 'jNQXAC9IVRw', 'name': 'Me at the zoo'}, 
        {'id': '9bZkp7q19f0', 'name': 'Gangnam Style'},
        {'id': 'Mus_vwhTCq0', 'name': 'Fireship'},
    ]
    
    ytt_api = YouTubeTranscriptApi()
    successful = []
    
    for video in test_videos:
        print(f"\nTesting {video['name']} ({video['id']})...")
        try:
            transcript = ytt_api.fetch(video['id'])
            print(f"  SUCCESS: {len(transcript)} snippets in {transcript.language}")
            successful.append(video['name'])
        except Exception as e:
            print(f"  FAILED: {e}")
    
    print(f"\nResults: {len(successful)}/{len(test_videos)} successful")
    for name in successful:
        print(f"  - {name}")
    
    return successful

def main():
    print("YouTube Transcript API - Correct Implementation Test")
    
    # Test basic functionality
    success, transcript_text = test_correct_api()
    
    if success:
        print("\nBasic API works! Running additional tests...")
        
        # Test other features
        test_list_transcripts()
        test_multiple_languages()
        successful_videos = test_multiple_videos()
        
        print(f"\n" + "="*60)
        print("FINAL RESULTS")
        print("="*60)
        print(f"Basic API: Working")
        print(f"Successful videos: {len(successful_videos) if successful_videos else 0}")
        
        if transcript_text:
            print(f"Sample transcript length: {len(transcript_text)} characters")
            print("\nThe Python library is working correctly!")
            print("Ready for Node.js integration using child_process.")
    else:
        print("\nBasic API failed. Check library installation.")

if __name__ == "__main__":
    main()