# Security Policy

## Reporting a Vulnerability

Do not disclose security-sensitive issues in a public issue before maintainers have had a chance to assess them.

Instead:

1. Use the platform's private security reporting flow if it is available.
2. If no private reporting flow is available, contact the repository owners privately before publishing details.
3. If you cannot find a private channel, open a minimal public issue asking for a private contact path without including exploit details.

Include:

- affected component or package
- reproduction steps
- impact assessment
- suggested remediation, if known

## Scope

Security reports are most relevant for:

- CLI behavior that executes local code or shells out to external tools
- dependency or supply-chain issues
- secrets handling and accidental credential exposure
- unsafe file access or path handling
