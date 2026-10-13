import { SETTINGS_BOOT_SCRIPT } from "../lib/settings-boot-script";

/**
 * Inline `<head>` script that applies saved appearance settings before the first paint, so the
 * page never flashes the wrong theme (ADR-0011). A Server Component: it is part of the server
 * HTML only, and the root layout never re-mounts it on the client.
 */
export function SettingsBootScript() {
  return (
    <script id="settings-boot-script" dangerouslySetInnerHTML={{ __html: SETTINGS_BOOT_SCRIPT }} />
  );
}
