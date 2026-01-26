import {
  baseObjectInputType,
  ZodEffects,
  ZodFormattedError,
  ZodObject,
  ZodRawShape,
} from "zod";

export type ZodError<T extends ZodRawShape> =
  | ZodFormattedError<
      { [k in keyof baseObjectInputType<T>]: baseObjectInputType<T>[k] },
      string | undefined
    >
  | undefined;

function validateZodShema<T extends ZodRawShape>(
  formData: FormData,
  validator: ZodObject<T> |  ZodEffects<ZodObject<T>>
): {
  errors: ZodError<T>;
} {
  const data = Object.fromEntries(formData.entries());
  const parseResult = validator.safeParse(data);
  return {
    errors: parseResult.error?.format(),
  };
}

export default validateZodShema;
