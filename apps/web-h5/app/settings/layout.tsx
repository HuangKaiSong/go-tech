import { httpClient } from '@/lib/http';
import { cookies } from 'next/headers';
import ClientPage from './page';

export default async function Page() {
  const cookieStore = await cookies()
  const token = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value
  const user = await httpClient.get('/go-tech/platform/platformCustomer/getInfo')
  
  return <ClientPage user={user?.data} token={token} />;
}