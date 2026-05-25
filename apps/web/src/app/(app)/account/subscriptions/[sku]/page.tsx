import { EditSubscriptionPage } from '@/_pages/subscriptions/ui/EditSubscriptionPage';

interface Props {
  params: Promise<{ sku: string }>;
}

export default async function Page({ params }: Props) {
  const { sku } = await params;
  return <EditSubscriptionPage sku={sku} />;
}
