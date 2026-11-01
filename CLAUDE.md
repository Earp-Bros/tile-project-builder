
<!-- EARP-ZERO-TRUST-PROJECT:START -->
## Project security profile (Zero-Trust Standard Z1–Z10)

The global rules in `~/.claude/CLAUDE.md` apply here too. This section records this project's specifics; keep it up to date and match the project's Notion row in Projects & Initiatives.

- **Notion project:** [link to the Projects & Initiatives page]
- **Runs as (Z1, Z3):** [e.g. signed-in user via Kiln / "Shopify Sync" scheduled scripts / dedicated read-only role]
- **Data sensitivity:** [Financial / HR / Health / Customer personal / Staff personal / Commercial / Internal only]
- **AI involved:** [AI-built / AI in product / None]. If AI in product: fields sent = [list]
- **Allowed deploy target (Z10):** SuiteCloud auth ID `Sandbox` only (or [staging project]). Production is deployed by a person.
- **Secrets (Z7):** names only, never values: [e.g. `custsecret_ss_shopify_client_secret` in NetSuite API Secrets]
- **External hosts this code may call:** [e.g. `*.myshopify.com`, `api.anthropic.com`]. Ask before adding any other.
- **Roles and audiences (Z2):** [list script deployments with Audience and Execute As Role]
- **On/off switch (Z8):** [script parameter or config record name]
- **Retirement:** revoke [tokens, integration records, apps, keys] the same day.
- **Open exceptions:** [none, or the exception, risk accepted, who accepted it, date]
<!-- EARP-ZERO-TRUST-PROJECT:END -->
