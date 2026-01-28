import { httpClient } from '@/lib/http';
import { cookies } from 'next/headers';
import ClientPage from './page';

export default async function Page() {
  let user: User|null = null
  const cookieStore = await cookies()
  const token = cookieStore.get('GO_TECH_AUTH_TOKEN')?.value

  try {
    const response = await httpClient.get<User>('/go-tech/platform/platformCustomer/getInfo')
    user = response.data as User
  } catch (error) {
    console.log(error);
  }
  
  return <ClientPage user={user} token={token} />;
}