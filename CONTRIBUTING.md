# Contributing

Thanks for your interest in the SendSafely MCP server.

## This repository is a publish-only mirror

This repository holds the compiled output of each released version of
`@sendsafely/mcp-server-local` as published to npm (the bundled
`@sendsafely/mcp-tools-core` sits under `vendor/` here rather than
`node_modules/`), together with the package's README, LICENSE and NOTICE
files, SECURITY.md, the issue templates, the SendSafely plugin for Claude
under `plugin/` and this file.
Development happens in a private SendSafely repository, and every release
lands here through an automated pipeline as a `v<version>` branch and pull
request opened by the `SendSafely-Github` account.

Because of that, **pull requests cannot be opened by outside contributors**.
Pull request creation on this repository is restricted to SendSafely
collaborators. There is no source here to change, and a change merged on
this side would be overwritten by the next release.

## How to report a problem

- **Bugs and unexpected behavior:** open an issue using the bug report
  template. Include the package version, your Node.js version, the MCP client
  you use and its version, and the error text from the client's MCP log.
  Please redact SendSafely URLs, package IDs, file names and anything else
  from your account before posting.
- **Security issues:** do not open an issue. Report them through the
  SendSafely Bug Reporting Form as described in [SECURITY.md](SECURITY.md).
- **Feature requests, and questions about your SendSafely account or API
  key:** contact support@sendsafely.com.

Issues are reviewed by the SendSafely engineering team.
