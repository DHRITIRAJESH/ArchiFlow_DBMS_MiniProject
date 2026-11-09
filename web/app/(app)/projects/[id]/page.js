import ProjectDetailClient from "./ProjectDetailClient";

export const instant = false;

export default async function ProjectDetailPage({ params }) {
  const { id } = await params;

  return <ProjectDetailClient id={id} />;
}
