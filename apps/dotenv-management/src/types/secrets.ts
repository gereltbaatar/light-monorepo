export type Environment = "dev" | "test" | "prod";

export interface SecretGroup {
  id: string;
  user_id: string;
  group_name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Secret {
  id: string;
  group_id: string;
  environment: Environment;
  key: string;
  value: string;
  created_at: string;
  updated_at: string;
}

export interface SecretGroupWithCounts extends SecretGroup {
  dev_count: number;
  test_count: number;
  prod_count: number;
}

export interface CreateSecretGroupInput {
  groupName: string;
  description?: string;
}

export interface CreateSecretInput {
  groupId: string;
  environment: Environment;
  key: string;
  value: string;
}

export interface UpdateSecretInput {
  key?: string;
  value?: string;
}

export interface ExportEnvInput {
  groupIds: string[];
  environment: Environment;
}
