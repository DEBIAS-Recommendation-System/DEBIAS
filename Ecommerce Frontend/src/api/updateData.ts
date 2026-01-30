"use server";
import { createClient } from "@/lib/supabase";
import { dbTableType } from "@/types/database.tables.types";
import { Tables, TablesUpdate } from "@/types/database.types";
import { PostgrestError } from "@supabase/supabase-js";
export default async function updateData<ITableName extends dbTableType>({
  tableName,
  payload,
  match,
}: {
  tableName: ITableName;
  payload: TablesUpdate<ITableName>;
  match: Partial<Tables<ITableName>>;
}): Promise<{
  data: Tables<ITableName>[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(tableName)
    .update(payload as any)
    .match(match)
    .select();
  return { data, error } as any;
}
