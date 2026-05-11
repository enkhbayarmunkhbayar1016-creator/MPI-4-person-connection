Perform an OWASP Top 10 security audit on the codebase. Check for:

1. **A01 Broken Access Control** — requireAuth middleware coverage
2. **A02 Cryptographic Failures** — token generation strength, password storage
3. **A03 Injection** — user input sanitization in Socket.IO handlers
4. **A05 Security Misconfiguration** — CORS settings, default credentials
5. **A07 Auth Failures** — session management, token invalidation

For each finding: file:line, severity (Critical/High/Medium/Low), recommendation.
