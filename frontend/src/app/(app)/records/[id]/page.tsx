import { DocumentDetailView } from "@/components/health/document-detail-view";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { id } = await params;

  return <DocumentDetailView documentId={id} />;
}
