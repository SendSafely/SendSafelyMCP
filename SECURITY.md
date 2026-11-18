# Security Policy

## Supported Versions

We support the latest released version of `@sendsafely/mcp-server-local`.
Please verify the issue against the latest release before reporting.

## Scope

In scope:

- The code in this repository and in the published
  `@sendsafely/mcp-server-local` npm package: credential storage and lookup,
  the approval gates in front of download, decrypt, upload, delete and
  key-material operations, download-path handling, and tool input validation.
- A vulnerability in one of this package's dependencies where the way this
  package uses it is the problem. Please also report the issue to the
  dependency's maintainers.

Out of scope:

- The behavior of the AI client or model that drives the server. On clients
  without MCP elicitation the server cannot verify that the assistant asked
  you before it set `proceed_without_prompt`; that limitation is documented
  in the README's Security model section and is not a vulnerability in this
  package.

## Reporting a Vulnerability

Please report security issues through the SendSafely
[Bug Reporting Form](https://explore.sendsafely.com/security/bug-report/),
which is how our [Bug Bounty Program](https://explore.sendsafely.com/security/bug-bounty/)
takes reports. The same form covers the SendSafely platform (the web portal,
the REST API and any `*.sendsafely.com` host), so you don't need to work out
which side a finding belongs to before reporting it.

Include the package version (from `npm ls @sendsafely/mcp-server-local`), the
MCP client you used, and the steps to reproduce. Please do not open a public
GitHub issue for a security problem.

## What to expect

We'll acknowledge your report and keep you updated as we look into it.
We appreciate responsible disclosure and the work of the security
research community.
