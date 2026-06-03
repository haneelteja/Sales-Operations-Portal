import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DeprecatedClient {
  id: string;
  client_name: string;
  branch: string | null;
}

export function useDeprecatedClients() {
  return useQuery<DeprecatedClient[]>({
    queryKey: ["deprecated-clients"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, client_name, branch")
        .eq("is_deprecated", true)
        .order("client_name", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Returns a Set of "clientName|||branch" keys for fast lookup */
export function useDeprecatedClientKeys() {
  const { data = [] } = useDeprecatedClients();
  return new Set(data.map((c) => `${c.client_name.trim()}|||${(c.branch ?? "").trim()}`));
}
