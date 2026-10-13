import { redirect } from "next/navigation";

import { DEFAULT_WORKSPACE_ID } from "@/config/app";
import { routes } from "@/config/routes";

/** `/` opens the workspace; from milestone M2 it opens the last active one. */
export default function HomePage(): never {
  redirect(routes.workspace(DEFAULT_WORKSPACE_ID));
}
