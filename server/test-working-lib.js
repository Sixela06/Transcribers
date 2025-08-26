// Create this as server/test-working-lib.js
async function testWorkingLib() {
  console.log('🧪 Testing youtube-transcript-api with proper instantiation...');
  
  try {
    const TranscriptClient = require('youtube-transcript-api');
    console.log('📦 Library loaded:', typeof TranscriptClient);
    
    // Create instance with 'new'
    const client = new TranscriptClient();
    console.log('✅ Client created successfully');
    console.log('📋 Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(client)));
    
    const videoId = 'dQw4w9WgXcQ';
    console.log(`\n🎬 Testing: ${videoId}`);
    console.log(`🔗 URL: https://www.youtube.com/watch?v=${videoId}`);
    
    // Try different method names
    const possibleMethods = ['fetchTranscript', 'getTranscript', 'fetch', 'get'];
    
    for (const methodName of possibleMethods) {
      if (typeof client[methodName] === 'function') {
        console.log(`🔧 Trying method: ${methodName}`);
        
        try {
          const transcript = await client[methodName](videoId);
          console.log(`✅ SUCCESS with ${methodName}: Found transcript`);
          console.log('📄 Type:', typeof transcript);
          
          if (Array.isArray(transcript)) {
            console.log(`📊 Array with ${transcript.length} segments`);
            if (transcript.length > 0) {
              console.log('📖 Sample segments:');
              transcript.slice(0, 3).forEach((segment, i) => {
                console.log(`  ${i + 1}:`, segment);
              });
              
              // Try to extract text
              const text = transcript.map(s => s.text || s.content || s).join(' ');
              console.log(`📝 Text preview: "${text.substring(0, 200)}..."`);
            }
          } else if (typeof transcript === 'string') {
            console.log(`📝 String preview: "${transcript.substring(0, 200)}..."`);
          } else {
            console.log('📋 Structure:', transcript);
          }
          
          return; // Success, exit
          
        } catch (methodError) {
          console.log(`❌ Method ${methodName} failed:`, methodError.message);
        }
      }
    }
    
    console.log('❌ No working methods found');
    
  } catch (error) {
    console.log('❌ Overall error:', error.message);
    console.log('📋 Full error:', error);
  }
}

testWorkingLib().catch(console.error);