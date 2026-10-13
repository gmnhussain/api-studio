/** Why an environment change was refused; each gets a message in the `environments` catalog (M6). */
export const ENVIRONMENT_ERRORS = ["invalid_name", "not_found", "no_workspace", "storage"] as const;
export type EnvironmentError = (typeof ENVIRONMENT_ERRORS)[number];
