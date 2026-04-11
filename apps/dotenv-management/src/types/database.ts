// Database types for Supabase
export interface SecretWithGroup {
  group_id: string;
  secret_groups: {
    user_id: string;
  };
}
