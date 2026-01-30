"use server";
import { dbTableType } from "@/types/database.tables.types";
import { Tables } from "@/types/database.types";
import { createClient } from "@/lib/supabase";
export default async function deleteData<ITableName extends dbTableType>({
  tableName,
  match,
  matchInArray,
}: {
  tableName: ITableName;
  match?: Partial<Tables<ITableName>>;
  matchInArray?: {
    column: keyof Tables<ITableName>;
    in: string[];
  };
}) {
  const supabase = createClient();
  let query = supabase.from(tableName).delete();
  if (match) {
    query = query.match(match);
  }
  if (matchInArray) {
    // @ts-ignore - Supabase type inference issue
    query = query.in(matchInArray.column as string, matchInArray.in);
  }
  const { error } = await query;
  return { error };
}
