import { redirect } from "next/navigation";

export default async function TasksDetailRedirect({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/registry/${threadId}`);
}
