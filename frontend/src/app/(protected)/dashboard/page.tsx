import { currentUser } from "@clerk/nextjs/server";
import { DashboardView } from "@/components/dashboard";

export default async function DashboardPage() {
  const user = await currentUser();

  return <DashboardView firstName={user?.firstName} />;
}
