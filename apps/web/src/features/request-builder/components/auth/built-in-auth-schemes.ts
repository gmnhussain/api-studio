import { ApiKeyAuthForm } from "./api-key-auth-form";
import { BasicAuthForm } from "./basic-auth-form";
import { BearerAuthForm } from "./bearer-auth-form";
import { InheritAuthNotice } from "./inherit-auth-notice";
import { OAuth2AuthForm } from "./oauth2-auth-form";
import type { AuthSchemeView } from "../../lib/auth-scheme-views";

/** The auth schemes of v0.1 (F-07), in the order the editor lists them. */
export const BUILT_IN_AUTH_SCHEMES: readonly AuthSchemeView[] = [
  { id: "inherit", create: () => ({ type: "inherit" }), Form: InheritAuthNotice },
  { id: "none", create: () => ({ type: "none" }), Form: null },
  {
    id: "basic",
    create: () => ({ type: "basic", username: "", password: "" }),
    Form: BasicAuthForm,
  },
  {
    id: "bearer",
    create: () => ({ type: "bearer", token: "", prefix: "Bearer" }),
    Form: BearerAuthForm,
  },
  {
    id: "api_key",
    create: () => ({ type: "api_key", key: "", value: "", placement: "header" }),
    Form: ApiKeyAuthForm,
  },
  {
    id: "oauth2",
    create: () => ({
      type: "oauth2",
      grantType: "client_credentials",
      accessTokenUrl: "",
      clientId: "",
      clientSecret: "",
      scope: "",
      accessToken: "",
    }),
    Form: OAuth2AuthForm,
  },
];
