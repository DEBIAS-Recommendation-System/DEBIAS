"use client";
export default function postLocalValues(
  key: string,
  event: React.FormEvent<HTMLFormElement>,
) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const formValues: { [key: string]: string } = {};
  formData.forEach((value, key) => {
    formValues[key] = value.toString();
  });
  localStorage.setItem(key, JSON.stringify(formValues));
}
