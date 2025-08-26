// Create this as server/test-fixed-headers.js
const ytdl = require('@distube/ytdl-core');

async function testFixedHeaders() {
  console.log('🧪 Testing fixed headers approach...');
  
  const videoId = 'dQw4w9WgXcQ';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    // Create agent with proper options
    const agent = ytdl.createAgent([], {
      localAddress: undefined,
    });

    const info = await ytdl.getInfo(videoUrl, {
      agent,
      requestOptions: {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
        }
      }
    });
    
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const englishTrack = captionTracks?.find(track => track.languageCode === 'en') || captionTracks?.[0];
    
    if (!englishTrack) {
      console.log('❌ No caption tracks found');
      return;
    }
    
    console.log(`📋 Using track: ${englishTrack.languageCode}`);
    
    // Add format parameter to URL
    let captionUrl = englishTrack.baseUrl;
    if (!captionUrl.includes('fmt=')) {
      captionUrl += captionUrl.includes('?') ? '&fmt=srv3' : '?fmt=srv3';
    }
    
    console.log(`🔗 Caption URL with format: ${captionUrl}`);
    
    const response = await fetch(captionUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.youtube.com/',
        'Origin': 'https://www.youtube.com'
      }
    });
    
    console.log(`📊 Response status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content type: ${response.headers.get('content-type')}`);
    
    const captionData = await response.text();
    console.log(`📄 Response length: ${captionData.length} characters`);
    console.log(`📝 Response preview: ${captionData.substring(0, 500)}`);
    
    if (captionData.length > 0) {
      // Check if it's JSON format
      if (captionData.trim().startsWith('{')) {
        console.log('🔧 Detected JSON format');
        try {
          const jsonData = JSON.parse(captionData);
          console.log(`📊 JSON structure:`, Object.keys(jsonData));
          
          if (jsonData.events) {
            console.log(`📝 Found ${jsonData.events.length} events`);
            const sampleEvent = jsonData.events.find(e => e.segs);
            if (sampleEvent) {
              console.log(`📖 Sample text:`, sampleEvent.segs.map(s => s.utf8).join(''));
            }
          }
        } catch (e) {
          console.log('❌ JSON parsing failed');
        }
      } else {
        console.log('🔧 Detected XML/other format');
      }
    } else {
      console.log('❌ Empty response');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testFixedHeaders().catch(console.error);