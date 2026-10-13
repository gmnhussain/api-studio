import { redirect } from "next/navigation";

import { routes } from "@/config/routes";

/** `/settings` opens the first section. */
export default function SettingsIndexPage(): never {
  redirect(routes.settings());
}
