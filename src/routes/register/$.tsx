import { SignUp } from "@clerk/tanstack-react-start";
import { Center } from "@mantine/core";
import { createFileRoute } from "@tanstack/react-router";

import { APP_NAME } from "#/lib/app.ts";

const RegisterPage = () => (
  <Center mih="80vh" p="lg">
    <SignUp routing="path" path="/register" signInUrl="/login" />
  </Center>
);

export const Route = createFileRoute("/register/$")({
  component: RegisterPage,
  head: () => ({ meta: [{ title: `新規登録 | ${APP_NAME}` }] }),
});
