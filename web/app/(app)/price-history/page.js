import PriceHistoryClient from "./PriceHistoryClient";

export const instant = false;

// Reads ?supplier_id= and ?material_id= so other pages can link
// straight to a filtered view (e.g. from a supplier's detail page)
export default async function PriceHistoryPage({ searchParams }) {
  const { supplier_id, material_id } = await searchParams;

  return (
    <PriceHistoryClient
      initialSupplierId={typeof supplier_id === "string" ? supplier_id : ""}
      initialMaterialId={typeof material_id === "string" ? material_id : ""}
    />
  );
}
