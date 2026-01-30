"use server";
import { dbTableType } from "@/types/database.tables.types";
import { Tables, TablesInsert } from "@/types/database.types";
import { createClient } from "@/lib/supabase";
import { PostgrestError } from "@supabase/supabase-js";
export default async function postData<ITableName extends dbTableType>({
  tableName,
  payload,
}: {
  tableName: ITableName;
  payload: TablesInsert<ITableName>[];
}): Promise<{
  data: Tables<ITableName>[] | null;
  error: PostgrestError | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from(tableName)
    .insert(payload as any)
    .select("*");
  return { data, error } as any;
}
