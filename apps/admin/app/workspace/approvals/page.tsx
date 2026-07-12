import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceApprovals } from "@/components/workspace-approvals";

export default function WorkspaceApprovalsPage() {
  return (
    <WorkspaceShell title="Approvals">
      <WorkspaceApprovals />
    </WorkspaceShell>
  );
}
