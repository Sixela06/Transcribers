// Create this as server/test-simple-api.js
async function testSimpleAPI() {
  console.log('🧪 Testing simple API approaches...');
  
  const videoId = 'dQw4w9WgXcQ';
  console.log(`🎬 Testing video: ${videoId}`);

  // Method 1: Direct XML approach
  console.log('\n🔄 Method 1: Direct XML');
  const directUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
  console.log(`🔗 URL: ${directUrl}`);

  try {
    const response = await fetch(directUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);
    console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);

    if (response.ok) {
      const content = await response.text();
      console.log(`📄 Content length: ${content.length}`);
      console.log(`📝 Preview: ${content.substring(0, 300)}...`);

      if (content.includes('<text')) {
        const textMatches = content.match(/<text[^>]*>(.*?)<\/text>/gs);
        if (textMatches) {
          console.log(`✅ Found ${textMatches.length} text segments`);
          const sampleText = textMatches[0]?.replace(/<[^>]*>/g, '').trim();
          console.log(`📖 Sample: "${sampleText}"`);
        }
      }
    } else {
      console.log('❌ Request failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Method 2: Auto-generated captions
  console.log('\n🔄 Method 2: Auto-generated');
  const autoUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&kind=asr`;
  console.log(`🔗 URL: ${autoUrl}`);

  try {
    const response = await fetch(autoUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/xml, text/xml, */*',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}`);

    if (response.ok) {
      const content = await response.text();
      console.log(`📄 Content length: ${content.length}`);
      console.log(`📝 Preview: ${content.substring(0, 300)}...`);

      if (content.includes('<text')) {
        const textMatches = content.match(/<text[^>]*>(.*?)<\/text>/gs);
        if (textMatches) {
          console.log(`✅ Found ${textMatches.length} text segments`);
          const sampleText = textMatches[0]?.replace(/<[^>]*>/g, '').trim();
          console.log(`📖 Sample: "${sampleText}"`);
        }
      }
    } else {
      console.log('❌ Request failed');
    }
  } catch (error) {
    console.log('❌ Error:', error.message);
  }

  // Method 3: Different language codes
  console.log('\n🔄 Method 3: Alternative formats');
  const altUrls = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&tlang=en`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=a.en`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&asr_langs=en&caps=asr&exp=xpe&xoaf=5`
  ];

  for (let i = 0; i < altUrls.length; i++) {
    console.log(`\n🔗 Alt ${i + 1}: ${altUrls[i]}`);
    try {
      const response = await fetch(altUrls[i], {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        }
      });

      console.log(`📊 Status: ${response.status}`);
      if (response.ok) {
        const content = await response.text();
        console.log(`📄 Length: ${content.length}`);
        if (content.length > 0) {
          console.log(`📝 Preview: ${content.substring(0, 200)}...`);
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testSimpleAPI().catch(console.error);