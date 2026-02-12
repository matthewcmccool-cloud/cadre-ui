import { redirect } from 'next/navigation';

// All users land on /discover as the default route
export default async function Home() {
  redirect('/discover');
}
