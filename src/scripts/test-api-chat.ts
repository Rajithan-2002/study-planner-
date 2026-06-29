import fetch from 'node-fetch' // wait, node-fetch is not in package.json, we can use global fetch if node is 18+

async function run() {
  console.log('Sending request to /api/chat...')
  try {
    const res = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Hello' }]
      })
    })

    console.log('Response status:', res.status)
    const text = await res.text()
    console.log('Response body prefix:', text.substring(0, 500))
  } catch (e: any) {
    console.error('Request failed:', e.message)
  }
}

run()
