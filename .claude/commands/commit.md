Create a Conventional Commits formatted git commit for staged changes. Steps:
1. Run `git diff --staged` to see what's staged
2. Determine the commit type: feat, fix, docs, test, refactor, chore
3. Write a concise commit message (≤72 chars subject line)
4. Include `Co-Authored-By: Claude <noreply@anthropic.com>` in the footer
5. Run `git commit -m "..."` with the formatted message

Format: `type(scope): description`
