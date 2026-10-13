# Security Policy

## Supported versions

API Studio is pre-1.0. Security fixes are made on the latest release and on `develop`.

## Reporting a vulnerability

Please report vulnerabilities privately through [GitHub private vulnerability reporting](https://docs.github.com/en/code-security/security-advisories/guidance-on-reporting-and-writing-information-about-vulnerabilities/privately-reporting-a-security-vulnerability) on this repository ("Security" tab → "Report a vulnerability"). Do not open a public issue.

Include:

- What is affected (component, version or commit).
- Steps to reproduce, or a proof of concept.
- The impact you expect.

You can expect an acknowledgement within 5 working days and a fix or mitigation plan within 30 days for confirmed issues. Reporters are credited in the release notes unless they prefer otherwise.

## Scope

Areas we care most about:

- The request proxy (`/api/v1/executions`, `packages/runner`): server-side request forgery, DNS rebinding, resource exhaustion.
- Response previews: script execution or data access from rendered HTML.
- Secret variables: leaks into history, exports, logs or generated code.
- Imported files: parsing that could execute code or corrupt stored data.

The design behind these controls is in [docs/architecture/request-execution.md](./docs/architecture/request-execution.md#security).
