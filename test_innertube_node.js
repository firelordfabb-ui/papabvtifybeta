async function testSearch(q) {
  try {
    const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'X-YouTube-Client-Name': '67',
        'X-YouTube-Client-Version': '1.20231204.01.00',
        'Origin': 'https://music.youtube.com',
        'Referer': 'https://music.youtube.com/'
      },
      body: JSON.stringify({
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20231204.01.00',
            hl: 'id',
            gl: 'ID'
          }
        },
        query: q
      })
    });

    console.log('Search status:', res.status);
    const data = await res.json();
    console.log('Got response keys:', Object.keys(data));
    return data;
  } catch (err) {
    console.error('Search error:', err);
  }
}

async function testPlayer(videoId) {
  // Test Android / iOS client context for raw stream URL
  const clients = [
    {
      name: 'ANDROID',
      client: {
        clientName: 'ANDROID',
        clientVersion: '19.09.37',
        androidSdkVersion: 30,
        hl: 'id',
        gl: 'ID'
      }
    },
    {
      name: 'IOS',
      client: {
        clientName: 'IOS',
        clientVersion: '19.09.3',
        deviceModel: 'iPhone14,3',
        hl: 'id',
        gl: 'ID'
      }
    },
    {
      name: 'ANDROID_TESTSUITE',
      client: {
        clientName: 'ANDROID_TESTSUITE',
        clientVersion: '1.9',
        androidSdkVersion: 30,
        hl: 'id',
        gl: 'ID'
      }
    }
  ];

  for (const c of clients) {
    try {
      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'com.google.android.youtube/19.09.37 (Linux; U; Android 11; en_US)'
        },
        body: JSON.stringify({
          context: {
            client: c.client
          },
          videoId: videoId
        })
      });
      console.log(`Player status (${c.name}):`, res.status);
      const data = await res.json();
      if (data.streamingData) {
        console.log(`StreamingData found for ${c.name}! Formats count:`, (data.streamingData.formats || []).length, 'Adaptive:', (data.streamingData.adaptiveFormats || []).length);
        const audio = (data.streamingData.adaptiveFormats || []).find(f => f.mimeType && f.mimeType.startsWith('audio/'));
        if (audio) {
          console.log(`Audio format (${c.name}): itag=${audio.itag}, mime=${audio.mimeType}, hasUrl=${!!audio.url}, hasSignatureCipher=${!!audio.signatureCipher}`);
          if (audio.url) {
            console.log('DIRECT AUDIO URL FOUND!', audio.url.substring(0, 80) + '...');
            return audio.url;
          }
        }
      } else {
        console.log(`No streamingData for ${c.name}. PlayabilityStatus:`, data.playabilityStatus?.status);
      }
    } catch (e) {
      console.error(`Error for ${c.name}:`, e.message);
    }
  }
}

async function run() {
  console.log('Testing InnerTube search...');
  await testSearch('Sal Priadi Gala Bunga Matahari');
  console.log('\nTesting InnerTube player...');
  await testPlayer('kOCkne-Bku4');
}

run();
