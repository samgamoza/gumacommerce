"use client";

import { useEffect, useState } from "react";
import type { SubscriptionPlan } from "@/lib/plan-access";
import { normalizeAdminPlan } from "@/lib/plan-access";

export interface TenantPlanState {
  plan: SubscriptionPlan;
  planLabel: string;
  credits: {
    generationsLeft: number;
    generationsLimit: number;
    chatLeft: number;
    chatLimit: number;
  };
  tenant: {
    name: string;
    slug: string;
    status: string;
  };
}

export function useTenantPlan() {
  const [state, setState] = useState<TenantPlanState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/plan")
      .then((res) => res.json())
      .then((data) => {
        setLoading(false);
        if (data.ok) {
          setState({
            plan: normalizeAdminPlan(data.plan),
            planLabel: data.planLabel,
            credits: data.credits,
            tenant: data.tenant,
          });
        }
      })
      .catch(() => setLoading(false));
  }, []);

  return { ...state, plan: state?.plan ?? "free", loading };
}
