import { redirect } from "next/navigation";

export default async function BoardDetailRedirect({
  params,
}: {
  params: Promise<{ threadId: string }>;
}) {
  const { threadId } = await params;
  redirect(`/tasks/${threadId}`);
}
