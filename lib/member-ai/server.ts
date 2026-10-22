import "server-only";
import { ensureUserRow } from "@/lib/users";
import { supabaseAdmin } from "@/lib/supabase-server";
import { openaiConnection } from "@/lib/daily/connections";
import { isOwnerUser } from "@/lib/admin-policy";
import { modelSchema, type ChatMessage } from "./model";

export const memberApiEnabled = () => process.env.MEMBER_AI_ENABLED === "true";
export async function memberActor() {
  const user = await ensureUserRow();
  if (!user) throw Error("Sign in to continue");
  // The current API pilot is Edmund-only, even if another account has active access.
  if (!isOwnerUser(user))
    throw Error("fcOS Chat is currently available only to Edmund");
  const { data, error } = await supabaseAdmin
    .from("member_ai_access")
    .select("active,model,allowance_micro,current_cycle_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw Error("Member assistant is temporarily unavailable");
  if (!data?.active)
    throw Error("Your assistant pilot access has not been activated yet");
  return { user, access: { ...data, model: modelSchema.parse(data.model) } };
}
export async function platformKey() {
  // Only provider credentials are shared. No admin vault token, notes or tasks
  // enter the member context. Recheck the configured owner at the source.
  const owner = process.env.WHATELZ_OWNER_USER_ID;
  if (!owner) throw Error("AI service is not configured");
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id,role")
    .eq("id", owner)
    .maybeSingle();
  if (error || !isOwnerUser(data)) throw Error("AI service is not configured");
  const connection = await openaiConnection(owner);
  if (!connection?.key) throw Error("AI service is not configured");
  return connection.key;
}
export async function conversationMessages(
  userId: string,
  conversationId: string,
): Promise<ChatMessage[]> {
  const conversation = await supabaseAdmin
    .from("member_ai_conversations")
    .select("id")
    .eq("id", conversationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (conversation.error || !conversation.data)
    throw Error("Conversation unavailable");
  const { data, error } = await supabaseAdmin
    .from("member_ai_messages")
    .select("id,role,body,proposals,created_at")
    .eq("user_id", userId)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw Error("Messages unavailable");
  return (data ?? []).reverse() as ChatMessage[];
}
export async function memberWorkspace(conversationId?: string) {
  const actor = await memberActor();
  const [chats, tasks, cycle, link] = await Promise.all([
    supabaseAdmin
      .from("member_ai_conversations")
      .select("id,title,created_at")
      .eq("user_id", actor.user.id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabaseAdmin
      .from("daily_tasks")
      .select("id,title,status,revision,due_on,lane")
      .eq("owner_id", actor.user.id)
      .in("status", ["proposed", "open", "blocked", "waiting"])
      .order("due_on")
      .limit(30),
    actor.access.current_cycle_id
      ? supabaseAdmin
          .from("member_ai_cycles")
          .select("id,allowance_micro,spent_micro,reserved_micro,ends_at")
          .eq("id", actor.access.current_cycle_id)
          .eq("user_id", actor.user.id)
          .maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabaseAdmin
      .from("member_emdee_links")
      .select("vault_id,handle,parent_path,encrypted_credentials")
      .eq("user_id", actor.user.id)
      .maybeSingle(),
  ]);
  if (chats.error || tasks.error || cycle.error || link.error)
    throw Error("Your workspace could not be loaded");
  const selected = conversationId ?? chats.data?.[0]?.id;
  return {
    name: actor.user.name,
    userId: actor.user.id,
    model: actor.access.model,
    enabled: memberApiEnabled(),
    chats: chats.data ?? [],
    tasks: tasks.data ?? [],
    selected: selected ?? null,
    messages: selected
      ? await conversationMessages(actor.user.id, selected)
      : [],
    cycle:
      cycle.data && new Date(cycle.data.ends_at).getTime() > Date.now()
        ? cycle.data
        : null,
    allowance: actor.access.allowance_micro,
    vault: link.data
      ? {
          id: link.data.vault_id,
          handle: link.data.handle,
          parent: link.data.parent_path,
          connected: !!link.data.encrypted_credentials,
        }
      : null,
  };
}
