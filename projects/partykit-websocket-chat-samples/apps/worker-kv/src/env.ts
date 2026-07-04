export interface Env {
  USERS_KV: KVNamespace;
  ROOMS_KV: KVNamespace;
  MESSAGES_KV: KVNamespace;
  SESSIONS_KV: KVNamespace;
  CHALLENGES_KV: KVNamespace;
  CHAT_ROOM: DurableObjectNamespace;
  ASSETS: Fetcher;
  RP_ID: string;
  RP_NAME: string;
  RP_ORIGIN: string;
  ENVIRONMENT: string;
}
