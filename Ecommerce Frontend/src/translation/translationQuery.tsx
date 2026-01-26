import { ILanguages } from "@/types/database.tables.types";
import getTranslation from "./getTranslation";

export const translationQuery = (locale: ILanguages) => ({
  queryKey: ["lang", locale],
  queryFn: async () => {
    const langRes = await getTranslation(locale);
    return langRes;
  },
});
