import { redirect } from "next/navigation";

/** AI Studio lives under GUMA Workspace → Marketing. */
export default function AiStudioRedirectPage() {
  redirect("/workspace/marketing");
}
