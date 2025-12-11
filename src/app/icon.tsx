import fs from 'fs'
import path from 'path'

// Route segment config
export const runtime = 'nodejs'

// Image metadata
export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/jpeg'

// Image generation using actual LOGO.jpg
export default function Icon() {
  const logoPath = path.join(process.cwd(), 'public', 'LOGO', 'LOGO.jpg')
  const logoBuffer = fs.readFileSync(logoPath)
  
  return new Response(logoBuffer, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  })
}
