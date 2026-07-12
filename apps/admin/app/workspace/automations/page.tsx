import { WorkspaceShell } from "@/components/workspace-shell";
import { AgentsManager } from "@/components/agents-manager";

/**
 * Automations module embeds the existing Agents UI inside Workspace.
 */
export default function WorkspaceAutomationsPage() {
  return (
    <WorkspaceShell title="Automations">
      <AgentsManager embedded />
    </WorkspaceShell>
  );
}
