import { WorkspaceOverview, WorkspaceShell } from "@/components/workspace-shell";

export default function WorkspacePage() {
  return (
    <WorkspaceShell title="GUMA Workspace">
      <WorkspaceOverview />
    </WorkspaceShell>
  );
}
