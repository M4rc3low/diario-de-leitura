# Security Policy

## Supported versions

This project is currently maintained as an active portfolio application. Security improvements should target the latest version available on the `main` branch.

## Reporting a vulnerability

If you find a vulnerability, do not open a public issue with sensitive details.

Please report it privately to the repository owner with:

- A clear description of the issue
- Steps to reproduce
- Expected impact
- Suggested mitigation, if available

## Security principles

- API keys must not be committed to the repository.
- The `.env` file must remain local.
- ISBNdb requests should go through the local Node.js proxy.
- Personal reading data should not be published without consent.
- If the project evolves to a backend database, authentication and access control should be added.
