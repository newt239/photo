import { Button, Select as MantineSelect, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useStore } from "@tanstack/react-form";

import { useFieldContext, useFormContext } from "#/hooks/demo.form-context";

type FormError = string | { message: string };

const selectErrors = (state: { meta: { errors: FormError[] } }): FormError[] => state.meta.errors;

export const SubscribeButton = ({ label }: { label: string }) => {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button type="submit" disabled={isSubmitting} loading={isSubmitting}>
          {label}
        </Button>
      )}
    </form.Subscribe>
  );
};

const ErrorMessages = ({ errors }: { errors: FormError[] }) => (
  <Stack gap={2} mt={4}>
    {errors.map((error) => (
      <Text key={typeof error === "string" ? error : error.message} size="sm" c="red" fw={700}>
        {typeof error === "string" ? error : error.message}
      </Text>
    ))}
  </Stack>
);

export const TextField = ({ label, placeholder }: { label: string; placeholder?: string }) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, selectErrors);

  return (
    <div>
      <TextInput
        label={label}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.currentTarget.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
};

export const TextArea = ({ label, rows = 3 }: { label: string; rows?: number }) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, selectErrors);

  return (
    <div>
      <Textarea
        label={label}
        value={field.state.value}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.currentTarget.value)}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
};

export const Select = ({
  label,
  values,
}: {
  label: string;
  values: { label: string; value: string }[];
  placeholder?: string;
}) => {
  const field = useFieldContext<string>();
  const errors = useStore(field.store, selectErrors);

  return (
    <div>
      <MantineSelect
        label={label}
        data={values}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(value) => field.handleChange(value ?? "")}
      />
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </div>
  );
};
