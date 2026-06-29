import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const statusPath = path.join(process.cwd(), 'public', 'whatsapp-status.json');
    if (fs.existsSync(statusPath)) {
      const content = fs.readFileSync(statusPath, 'utf-8');
      return NextResponse.json(JSON.parse(content));
    }
  } catch (e) {
    console.error(e);
  }

  // Fallback default status
  return NextResponse.json({ status: 'connected', timestamp: Date.now() });
}
