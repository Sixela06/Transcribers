// Create this as server/test-alt-lib.js
async function testAlternativeLib() {
  console.log('🧪 Testing youtube-transcript...');
  
  try {
    const { YoutubeTranscript } = require('youtube-transcript');
    console.log('📦 Library loaded successfully');
    
    const videoId = 'dQw4w9WgXcQ';
    console.log(`\n🎬 Testing: ${videoId}`);
    
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    console.log(`✅ SUCCESS: Found transcript`);
    console.log('📄 Type:', typeof transcript);
    
    if (Array.isArray(transcript)) {
      console.log(`📊 Array with ${transcript.length} items`);
      if (transcript.length > 0) {
        console.log('📖 Sample segments:');
        transcript.slice(0, 3).forEach((segment, i) => {
          console.log(`  ${i + 1}:`, segment);
        });
        
        const text = transcript.map(s => s.text).join(' ');
        console.log(`📝 Text preview: "${text.substring(0, 200)}..."`);
      }
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testAlternativeLib().catch(console.error);