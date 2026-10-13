import packageManifest from "../../package.json";

/** Product name, as shown in the UI and page titles. */
export const APP_NAME = "API Studio";

/** The running version, from the web app's package.json. */
export const APP_VERSION = packageManifest.version;

/**
 * The workspace every visit opens until workspaces are stored (milestone M2), when `/` will open
 * the last active workspace instead.
 */
export const DEFAULT_WORKSPACE_ID = "local";
