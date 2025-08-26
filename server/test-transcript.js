// Create this as server/test-transcript.js
const { YoutubeTranscript } = require('youtube-transcript');

async function testTranscript() {
  console.log('🧪 Testing youtube-transcript library directly...');
  console.log('📦 Library version:', require('youtube-transcript/package.json').version);
  
  const testVideos = [
    'dQw4w9WgXcQ', // Rick Roll
    'jNQXAC9IVRw', // Me at the zoo
    'Mus_vwhTCq0', // Fireship
  ];

  for (const videoId of testVideos) {
    console.log(`\n🎬 Testing video: ${videoId}`);
    console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}`);
    
    try {
      const transcript = await YoutubeTranscript.fetchTranscript(videoId);
      console.log(`✅ SUCCESS: Found ${transcript.length} entries`);
      
      if (transcript.length > 0) {
        console.log('📝 First entry:', JSON.stringify(transcript[0], null, 2));
        const fullText = transcript.map(entry => entry.text).join(' ');
        console.log(`📖 Preview: "${fullText.substring(0, 200)}..."`);
      }
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
}

testTranscript().catch(console.error);