"use client";

import { WorkspaceShell } from "@/components/workspace-shell";
import { AiStudioCampaign } from "@/components/ai-studio-campaign";

/**
 * Marketing module embeds the existing AI Studio campaign UI inside Workspace.
 * PatternAdminShell is nested — AiStudioCampaign wraps itself; we need a variant
 * without double shell. For MVP we render the campaign body by importing and
 * noting AiStudioCampaign includes its own shell — override via thin wrapper page.
 */
export default function WorkspaceMarketingPage() {
  return (
    <WorkspaceShell title="Marketing">
      <div className="-mx-0 space-y-2">
        <p className="text-sm text-gray-500">
          Content generation with plan quotas. Significant publishes still go through approval
          queues (Agents → content_queue).
        </p>
        <div className="rounded-2xl border border-gray-200 bg-white p-1">
          <AiStudioCampaign embedded />
        </div>
      </div>
    </WorkspaceShell>
  );
}
