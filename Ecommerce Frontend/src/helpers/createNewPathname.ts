export default function createNewPathname({
  currentPathname,
  currentSearchParams,
  values,
}: {
  currentPathname: string;
  currentSearchParams: URLSearchParams;
  values: {
    name: string;
    value: string;
  }[];
}) {
  const params = new URLSearchParams(currentSearchParams.toString());
  values.forEach(({ name, value }) => {
    params.set(name, value);
  });
  return currentPathname + "?" + params.toString();
}
