import { redirect } from "next/navigation";
import { EditorClient } from "../../components/EditorClient";
import { getCurrentUser } from "../../lib/auth";

export default async function EditorPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return <EditorClient initialUser={{ name: user.name, email: user.email, planKey: user.planKey, status: user.subscriptionStatus }} />;
}
