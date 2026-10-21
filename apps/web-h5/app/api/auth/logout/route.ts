import { cookies } from 'next/headers';
import { withRuntimeScope } from '@/db';

async function handlePOST() {
  const cookieStore = await cookies();
  cookieStore.delete('GO_TECH_AUTH_TOKEN');

  return new Response(null, { status: 204, headers: { 'Content-Type': 'application/json' } });
}

export const POST = withRuntimeScope(handlePOST);
