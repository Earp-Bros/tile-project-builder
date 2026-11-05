
<!-- EARP-ZERO-TRUST-PROJECT:START -->
## Project security profile (Zero-Trust Standard Z1–Z10)

The global rules in `~/.claude/CLAUDE.md` apply here too. This section records this project's specifics; keep it up to date and match the project's Notion row in Projects & Initiatives.

- **Notion project:** [PRJ-26 Shopify : My Projects – Customer View](https://app.notion.com/p/407eede4ca1981479847f919bc35079f) and [PRJ-27 NS : My Projects – Staff View](https://app.notion.com/p/407eede4ca19810ab655cf14562dbb6d)
- **Runs as (Z1, Z3):** The Shopify app "Tile Project Builder" (client ID in shopify.app.toml). The Configuration Hub runs as the signed-in Shopify admin and sends Shopify's session token to the Render backend. Scopes: read_products, write_products (required by Shopify for the app-declared product FAQ metafield, `[product.metafields.app.faq]`; the app code itself writes no products), read_customers.
- **Data sensitivity:** Customer personal (read-only email lookup for the staff check, done by the Render backend); Commercial (settings).
- **AI involved:** AI-built; AI in product: Shopify Sidekick can read the app's FAQ entries (question, answer, visibility flag).
- **Allowed deploy target (Z10):** There is no dev store; `shopify app deploy` releases to the live store and is run by a person.
- **Secrets (Z7):** names only, never values: [e.g. `custsecret_ss_shopify_client_secret` in NetSuite API Secrets]
- **External hosts this code may call:** `shopify-projects-app.onrender.com`, the Shopify Admin API. Ask before adding any other.
- **Roles and audiences (Z2):** [list script deployments with Audience and Execute As Role]
- **On/off switch (Z8):** [script parameter or config record name]
- **Retirement:** revoke [tokens, integration records, apps, keys] the same day.
- **Open exceptions:** [none, or the exception, risk accepted, who accepted it, date]
<!-- EARP-ZERO-TRUST-PROJECT:END -->
