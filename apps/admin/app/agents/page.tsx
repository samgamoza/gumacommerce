import { redirect } from "next/navigation";

/** Agents live under GUMA Workspace → Automations. */
export default function AgentsRedirectPage() {
  redirect("/workspace/automations");
}
