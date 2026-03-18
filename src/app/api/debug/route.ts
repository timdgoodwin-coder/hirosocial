import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const results: Record<string, string> = {};
  
  // Test 1: Basic env vars
  results.anthropic_key = process.env.ANTHROPIC_API_KEY ? 'present' : 'MISSING';
  results.supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL ? 'present' : 'MISSING';
  results.node_version = process.version;
  
  // Test 2: Try importing jsdom
  try {
    const { JSDOM } = require('jsdom');
    const dom = new JSDOM('<html><body><p>test</p></body></html>');
    results.jsdom = 'ok: ' + dom.window.document.querySelector('p')?.textContent;
  } catch (e: unknown) {
    results.jsdom = 'ERROR: ' + (e instanceof Error ? e.message : String(e));
  }
  
  // Test 3: Try importing cheerio
  try {
    const cheerio = await import('cheerio');
    const $ = cheerio.load('<p>hello</p>');
    results.cheerio = 'ok: ' + $('p').text();
  } catch (e: unknown) {
    results.cheerio = 'ERROR: ' + (e instanceof Error ? e.message : String(e));
  }
  
  // Test 4: Try importing readability
  try {
    const { Readability } = require('@mozilla/readability');
    results.readability = 'ok: ' + typeof Readability;
  } catch (e: unknown) {
    results.readability = 'ERROR: ' + (e instanceof Error ? e.message : String(e));
  }
  
  // Test 5: Try importing anthropic
  try {
    const Anthropic = require('@anthropic-ai/sdk');
    results.anthropic_sdk = 'ok: ' + typeof Anthropic;
  } catch (e: unknown) {
    results.anthropic_sdk = 'ERROR: ' + (e instanceof Error ? e.message : String(e));
  }

  return NextResponse.json(results);
}
