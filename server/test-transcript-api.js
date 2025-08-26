// Create this as server/test-fixed.js
const TranscriptClient = require('youtube-transcript-api').default || require('youtube-transcript-api');

async function testFixedAPI() {
  console.log('Testing youtube-transcript-api with improved initialization...');
  
  try {
    console.log('1. Creating client...');
    const client = new TranscriptClient({
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 30000, // 30 second timeout
    });
    
    console.log('2. Waiting for client ready with timeout...');
    
    // Add a timeout to the ready promise
    const readyWithTimeout = Promise.race([
      client.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Client initialization timeout')), 15000)
      )
    ]);
    
    await readyWithTimeout;
    console.log('Client initialization completed!');
    
    // Add a small delay before using the client
    console.log('3. Waiting additional time for full initialization...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const videoId = 'dQw4w9WgXcQ';
    console.log(`\n4. Testing video: ${videoId}`);
    
    console.log('5. Fetching transcript with error handling...');
    
    let result;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(`   Attempt ${attempts}/${maxAttempts}...`);
        
        result = await client.getTranscript(videoId, {
          timeout: 20000 // 20 second timeout for the request
        });
        
        console.log('   Success!');
        break;
      } catch (err) {
        console.log(`   Attempt ${attempts} failed: ${err.message}`);
        
        if (attempts < maxAttempts) {
          console.log('   Retrying in 3 seconds...');
          await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
          throw err;
        }
      }
    }
    
    if (!result) {
      throw new Error('No result after all attempts');
    }
    
    console.log('\n=== RESULTS ===');
    console.log('Video ID:', result.id);
    console.log('Title:', result.title);
    console.log('Status:', result.playabilityStatus?.status);
    console.log('Reason:', result.playabilityStatus?.reason || 'None');
    console.log('Tracks found:', result.tracks?.length || 0);
    console.log('Languages:', result.languages?.length || 0);
    
    if (result.tracks && result.tracks.length > 0) {
      const track = result.tracks[0];
      const segments = track.transcript || [];
      
      console.log(`\nTranscript details:`);
      console.log(`- Language: ${track.language}`);
      console.log(`- Segments: ${segments.length}`);
      
      if (segments.length > 0) {
        console.log('\nFirst 3 segments:');
        segments.slice(0, 3).forEach((seg, i) => {
          console.log(`  ${i + 1}. [${seg.start}s] "${seg.text}"`);
        });
        
        const fullText = segments.map(s => s.text).join(' ').replace(/\s+/g, ' ').trim();
        console.log(`\nFull transcript: ${fullText.length} characters`);
        console.log(`Preview: "${fullText.substring(0, 200)}..."`);
        
        console.log('\n✅ SUCCESS! Library is working!');
        return true;
      }
    }
    
    console.log('❌ No transcript content found');
    return false;
    
  } catch (error) {
    console.log('❌ ERROR:', error.message);
    
    if (error.message.includes('timeout')) {
      console.log('💡 This might be a network or Firebase initialization issue');
    } else if (error.message.includes('not fully initialized')) {
      console.log('💡 The client initialization process failed');
    }
    
    console.log('\nFull error details:', error);
    return false;
  }
}

// Alternative test with different approach
async function testAlternativeApproach() {
  console.log('\n=== TRYING ALTERNATIVE APPROACH ===');
  
  try {
    // Try without custom headers first
    console.log('Testing with minimal configuration...');
    const client = new TranscriptClient();
    
    console.log('Waiting for ready state...');
    await Promise.race([
      client.ready,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout')), 10000)
      )
    ]);
    
    console.log('Minimal client ready, testing...');
    const result = await client.getTranscript('dQw4w9WgXcQ');
    
    console.log('Alternative approach worked!');
    console.log('Status:', result.playabilityStatus?.status);
    console.log('Tracks:', result.tracks?.length || 0);
    
    return true;
    
  } catch (error) {
    console.log('Alternative approach failed:', error.message);
    return false;
  }
}

// Run all tests
(async () => {
  console.log('Starting comprehensive test...\n');
  
  const mainTest = await testFixedAPI();
  
  if (!mainTest) {
    console.log('\n📋 Main test failed, trying alternative...');
    const altTest = await testAlternativeApproach();
    
    if (!altTest) {
      console.log('\n💥 Both tests failed. The library may have issues.');
      console.log('💡 Consider trying a different transcript library or approach.');
    }
  }
})().catch(console.error);