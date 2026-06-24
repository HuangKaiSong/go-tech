import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('GO_TECH_AUTH_TOKEN');

  return new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } });
}
