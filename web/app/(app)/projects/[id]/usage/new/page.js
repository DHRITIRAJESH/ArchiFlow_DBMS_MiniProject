import RecordUsageForm from "./RecordUsageForm";

export const instant = false;

export default async function RecordUsagePage({ params }) {
  const { id } = await params;

  return <RecordUsageForm id={id} />;
}
