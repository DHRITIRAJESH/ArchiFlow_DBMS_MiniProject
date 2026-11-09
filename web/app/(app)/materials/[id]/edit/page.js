import MaterialForm from "../../MaterialForm";

export const instant = false;

export default async function EditMaterialPage({ params }) {
  const { id } = await params;

  return <MaterialForm id={id} />;
}
