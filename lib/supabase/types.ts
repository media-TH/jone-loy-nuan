import type { Database as GeneratedDatabase } from '@/lib/database.types';

export type Database = GeneratedDatabase;

export type PublicSchema = Database['public'];
export type PublicTables = PublicSchema['Tables'];
export type PublicTableName = keyof PublicTables;

export type TableRow<T extends PublicTableName> = PublicTables[T]['Row'];
export type TableInsert<T extends PublicTableName> = PublicTables[T]['Insert'];
export type TableUpdate<T extends PublicTableName> = PublicTables[T]['Update'];
