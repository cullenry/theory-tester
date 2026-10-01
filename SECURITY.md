# Security Policy

## Reporting a vulnerability

Please do not open a public GitHub issue for a suspected security vulnerability.

Contact the project maintainer through the security/contact address published for TheoryPrep and include enough detail to reproduce the issue. Do not include passwords, access tokens or other secrets in the report.

## Secret handling

Server-only credentials such as the Supabase secret key, VAPID private key and cron secret must stay in the deployment environment. They must never be committed to the repository or exposed through client components.

## Dependency and source-code checks

Pull requests and pushes run linting, TypeScript checking, a production build and a full-history Gitleaks scan.
