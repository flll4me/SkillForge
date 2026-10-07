export interface QueryExecutor {
  query<Row = Record<string, unknown>>(
    sql: string,
    values?: unknown[],
  ): Promise<{ rows: Row[]; rowCount: number | null }>;
}

export interface Database extends QueryExecutor {
  connect(): Promise<DatabaseClient>;
}

export interface DatabaseClient extends QueryExecutor {
  release(): void;
}

export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BLOCKED';

export interface PublicUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthenticatedUser extends PublicUser {
  password_hash: string;
}
