import { timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

function passwordsMatch(input: string, expected: string): boolean {
  const inputBuffer = Buffer.from(input);
  const expectedBuffer = Buffer.from(expected);
  if (inputBuffer.length !== expectedBuffer.length) {
    return false;
  }
  return timingSafeEqual(inputBuffer, expectedBuffer);
}

export async function POST(request: NextRequest) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) {
    return NextResponse.json(
      { error: 'Password protection is not configured. Set the APP_PASSWORD environment variable.' },
      { status: 503 }
    );
  }

  let password = '';
  try {
    const body = await request.json();
    if (typeof body?.password === 'string') {
      password = body.password;
    }
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!password || !passwordsMatch(password, expected)) {
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
