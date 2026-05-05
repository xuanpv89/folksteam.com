import cmsContent from '@data/cmsContent.json';

export const prerender = true;

export function GET() {
  return new Response(JSON.stringify(cmsContent), {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'Content-Type': 'application/json; charset=utf-8',
    },
  });
}
