"use client";
export default function getLocalValues(key: string) {
  const storedFormValues = localStorage.getItem(key);
  const defaultFormValues = storedFormValues
    ? JSON.parse(storedFormValues)
    : {};
  return defaultFormValues;
}
