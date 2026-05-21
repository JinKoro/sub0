import { ProjectEditView } from '@/_pages/projects/ui/ProjectEditView';

interface Props {
  params: Promise<{ sku: string }>;
}

export default async function Page({ params }: Props) {
  const { sku } = await params;
  return <ProjectEditView sku={sku} />;
}
