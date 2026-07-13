import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceShipping } from "@/components/workspace-shipping";

export default function WorkspaceShippingPage() {
  return (
    <WorkspaceShell title="Shipping">
      <WorkspaceShipping />
    </WorkspaceShell>
  );
}
