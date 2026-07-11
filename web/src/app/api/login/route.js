import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { token } = await request.json();
    const response = NextResponse.json({ success: true });
    
    response.cookies.set('busway_token', token, {
      httpOnly: true,
      secure: true, // ZAP scan needs this flag active
      sameSite: 'lax',
      path: '/',
      maxAge: 3600, // 1 hora
    });
    
    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Error setting session cookie' }, { status: 500 });
  }
}
