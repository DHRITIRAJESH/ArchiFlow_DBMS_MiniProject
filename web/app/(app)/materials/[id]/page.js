import MaterialDetailClient from "./MaterialDetailClient";

export const instant = false;

export default async function MaterialDetailPage({ params }) {
  const { id } = await params;

  return <MaterialDetailClient id={id} />;
}
