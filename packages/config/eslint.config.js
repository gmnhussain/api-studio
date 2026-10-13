import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

import { base } from "./eslint/base.js";

// This package is plain JavaScript; lint it without type information.
export default defineConfig([...base(import.meta.dirname), tseslint.configs.disableTypeChecked]);
