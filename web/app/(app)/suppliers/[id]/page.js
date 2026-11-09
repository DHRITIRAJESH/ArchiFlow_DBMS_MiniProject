import SupplierDetailClient from "./SupplierDetailClient";

export const instant = false;

export default async function SupplierDetailPage({ params }) {
  const { id } = await params;

  return <SupplierDetailClient id={id} />;
}
