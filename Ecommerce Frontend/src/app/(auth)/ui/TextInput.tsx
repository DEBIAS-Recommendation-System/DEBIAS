import { OutlinedInputProps, TextField, TextFieldProps } from "@mui/material";

export default function TextInput(args: Omit<TextFieldProps, "variant">) {
  return <TextField className="w-full" variant="filled" {...args} />;
}
