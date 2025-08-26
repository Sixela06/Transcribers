// Create this as server/debug-xml.js
const ytdl = require('@distube/ytdl-core');

async function debugXmlParsing() {
  console.log('🔍 Debugging XML parsing...');
  
  const videoId = 'dQw4w9WgXcQ';
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  
  try {
    const info = await ytdl.getInfo(videoUrl);
    const captionTracks = info.player_response?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    const englishTrack = captionTracks.find(track => track.languageCode === 'en') || captionTracks[0];
    
    console.log(`📋 Using track: ${englishTrack.languageCode}`);
    console.log(`🔗 Caption URL: ${englishTrack.baseUrl}`);
    
    const response = await fetch(englishTrack.baseUrl);
    const captionXml = await response.text();
    
    console.log(`📄 XML Length: ${captionXml.length} characters`);
    console.log(`📝 XML Preview (first 500 chars):`);
    console.log(captionXml.substring(0, 500));
    console.log('\n--- End XML Preview ---\n');
    
    // Try different regex patterns
    console.log('🧪 Testing different parsing methods...');
    
    // Method 1: Original pattern
    const pattern1 = /<text[^>]*>(.*?)<\/text>/g;
    const matches1 = [...captionXml.matchAll(pattern1)];
    console.log(`Method 1: Found ${matches1.length} matches`);
    if (matches1.length > 0) {
      console.log(`Sample 1: "${matches1[0][1]}"`);
    }
    
    // Method 2: More flexible pattern
    const pattern2 = /<text[^>]*>([^<]*)<\/text>/g;
    const matches2 = [...captionXml.matchAll(pattern2)];
    console.log(`Method 2: Found ${matches2.length} matches`);
    if (matches2.length > 0) {
      console.log(`Sample 2: "${matches2[0][1]}"`);
    }
    
    // Method 3: Even more flexible
    const pattern3 = /<text[^>]*>([\s\S]*?)<\/text>/g;
    const matches3 = [...captionXml.matchAll(pattern3)];
    console.log(`Method 3: Found ${matches3.length} matches`);
    if (matches3.length > 0) {
      console.log(`Sample 3: "${matches3[0][1]}"`);
    }
    
    // Method 4: Split and parse approach
    const textSegments = captionXml.split('<text');
    console.log(`Method 4 (split): Found ${textSegments.length - 1} potential segments`);
    
    if (textSegments.length > 1) {
      const sampleSegment = textSegments[1];
      console.log(`Sample segment: "${sampleSegment.substring(0, 200)}"`);
      
      // Extract text content
      const contentStart = sampleSegment.indexOf('>') + 1;
      const contentEnd = sampleSegment.indexOf('</text>');
      if (contentStart > 0 && contentEnd > contentStart) {
        const content = sampleSegment.substring(contentStart, contentEnd);
        console.log(`Extracted content: "${content}"`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugXmlParsing().catch(console.error);