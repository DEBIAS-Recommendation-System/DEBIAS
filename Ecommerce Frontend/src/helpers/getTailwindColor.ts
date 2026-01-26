import tailwindConfig from "../../tailwind.config";
import resolveConfig from "tailwindcss/resolveConfig";
const fullConfig = resolveConfig(tailwindConfig);
export function getTailwindColor(color: string) {
  // @ts-ignore BUG : possible bug in tailwindcss type
  return fullConfig?.theme?.colors?.[color];
}
