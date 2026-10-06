import { NextRequest, NextResponse } from 'next/server';

function getApiBaseUrl(): string | null {
  const url = process.env.NEXT_PUBLIC_HWB_API_URL;
  return url ? url.replace(/\/$/, '') : null;
}

export async function GET(request: NextRequest) {
  try {
    const API_BASE_URL = getApiBaseUrl();
    if (!API_BASE_URL) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_HWB_API_URL is not configured' },
        { status: 500 }
      );
    }

    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    
    // Build the target URL
    const targetUrl = `${API_BASE_URL}/itbs${queryString ? `?${queryString}` : ''}`;
    
    console.log('Proxying request to:', targetUrl);
    
    // Make the request to the external API
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NextJS-Proxy/1.0',
      },
    });
    
    if (!response.ok) {
      console.error('External API error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `External API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    
    // Return the data with CORS headers
    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
    
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch data from external API' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 