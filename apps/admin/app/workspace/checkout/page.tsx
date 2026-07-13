import { WorkspaceShell } from "@/components/workspace-shell";
import { WorkspaceCheckout } from "@/components/workspace-checkout";

export default function WorkspaceCheckoutPage() {
  return (
    <WorkspaceShell title="Checkout">
      <WorkspaceCheckout />
    </WorkspaceShell>
  );
}
