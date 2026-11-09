import EditProjectForm from "./EditProjectForm";

export const instant = false;

export default async function EditProjectPage({ params }) {
  const { id } = await params;

  return <EditProjectForm id={id} />;
}
