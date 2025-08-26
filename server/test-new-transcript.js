// Create this as server/test-new-transcript.js
const ytdl = require('@distube/ytdl-core');

async function testNewTranscript() {
  console.log('🧪 Testing ytdl-core library for transcripts...');
  
  const testVideos = [
    'dQw4w9WgXcQ', // Rick Roll
    'jNQXAC9IVRw', // Me at the zoo
  ];

  for (const videoId of testVideos) {
    console.log(`\n🎬 Testing video: ${videoId}`);
    console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}`);
    
    try {
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const info = await ytdl.getInfo(videoUrl);
      
      console.log(`✅ Video found: "${info.videoDetails.title}"`);
      
      const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      
      if (!captionTracks || captionTracks.length === 0) {
        console.log('❌ No caption tracks available');
        continue;
      }

      console.log(`📝 Found ${captionTracks.length} caption tracks`);
      
      const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0];
      console.log(`📋 Selected track: ${englishTrack.languageCode} (${englishTrack.name?.simpleText})`);
      
      // Test fetching actual captions
      const captionUrl = englishTrack.baseUrl;
      const response = await fetch(captionUrl);
      const captionXml = await response.text();
      
      const textMatches = captionXml.match(/<text[^>]*>(.*?)<\/text>/g);
      
      if (textMatches) {
        console.log(`✅ SUCCESS: Found ${textMatches.length} caption segments`);
        const sampleText = textMatches[0]?.replace(/<[^>]*>/g, '').trim();
        console.log(`📖 Sample text: "${sampleText}"`);
      } else {
        console.log('❌ Could not parse caption XML');
      }
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
}

testNewTranscript().catch(console.error);