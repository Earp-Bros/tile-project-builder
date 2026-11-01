#!/usr/bin/env node
// Earp Zero-Trust guard for Claude Code (controls Z7 and Z10).
// Runs before every Bash, Read, Edit, Write, MultiEdit, NotebookEdit, Grep and Glob call.
// Exit code 2 blocks the call and tells Claude why. Exit 0 lets it through.
// Owner: Head of Infrastructure. Standard: Notion > Shared Planning & Process > Zero-Trust Security Standard (Z1–Z10).

const fs = require('fs');
const path = require('path');
const os = require('os');

const HOME = os.homedir();

function block(reason) {
  process.stderr.write(
    `BLOCKED by Earp Zero-Trust guard: ${reason}\n` +
    `This action breaks the Zero-Trust Security Standard (Z7/Z10). ` +
    `Do not try another way round it. Tell the user what you were trying to do and let them do it themselves if it is needed.\n`
  );
  process.exit(2);
}

// ---- Files Claude must never read or change -------------------------------
const SECRET_FILE_PATTERNS = [
  /(^|\/)\.env(\.(?!example$|sample$|template$)[^/]*)?$/i, // .env, .env.local, .env.production (not .env.example)
  /\.(pem|key|p12|pfx|jks|keystore|asc|gpg)$/i,
  /(^|\/)id_(rsa|ed25519|ecdsa|dsa)(\.pub)?$/i,
  /(^|\/)(credentials|service[-_]?account[^/]*|client_secret[^/]*|token[s]?)\.json$/i,
  /(^|\/)\.npmrc$/i,
  /(^|\/)\.netrc$/i,
  /(^|\/)\.git-credentials$/i,
  /(^|\/)secrets?(\/|$)/i,
];
const SECRET_DIRS = [
  path.join(HOME, '.ssh'),
  path.join(HOME, '.aws'),
  path.join(HOME, '.config', 'gcloud'),
  path.join(HOME, '.suitecloud-sdk'),
  path.join(HOME, '.gnupg'),
  path.join(HOME, '.docker'),
  path.join(HOME, '.kube'),
];
// Files Claude may read but must never change (its own guard rails).
const PROTECTED_WRITE_PATTERNS = [
  /(^|\/)\.claude\/settings(\.local)?\.json$/i,
  /(^|\/)\.claude\/hooks\//i,
  /(^|\/)project\.json$/i,            // SuiteCloud auth ID binding
  /(^|\/)\.git\/hooks\//i,
  /(^|\/)\.git-hooks\//i,
  /(^|\/)\.gitleaks\.toml$/i,
];

function expand(p) {
  if (!p) return '';
  if (p.startsWith('~')) p = path.join(HOME, p.slice(1));
  return path.resolve(p);
}

function isSecretPath(p) {
  const abs = expand(p);
  if (SECRET_DIRS.some((d) => abs === d || abs.startsWith(d + path.sep))) return true;
  return SECRET_FILE_PATTERNS.some((re) => re.test(abs));
}

function isProtectedWrite(p) {
  const abs = expand(p);
  return PROTECTED_WRITE_PATTERNS.some((re) => re.test(abs));
}

// ---- Shell commands ---------------------------------------------------------
function checkBash(cmd) {
  const c = ` ${cmd} `.replace(/\s+/g, ' ');

  // Secrets on screen or in the environment
  if (/(^|[\s;&|(])(printenv|env)(\s*$|\s*[;&|)])/.test(c)) block('printing environment variables can expose secrets.');
  if (/\becho\b[^;&|]*\$\{?[A-Z0-9_]*(SECRET|TOKEN|KEY|PASSWORD|PASS|CREDENTIAL)[A-Z0-9_]*/i.test(c)) block('printing a secret variable.');
  const envRefs = c.match(/(^|[\s'"=\/<>(])\.env(\.[\w.-]+)?(?=$|[\s'";&|)<>])/g) || [];
  if (envRefs.some((r) => !/\.env\.(example|sample|template)$/.test(r))) {
    block('commands may not touch .env files (use .env.example for placeholders).');
  }
  if (/\.(pem|p12|pfx|key)\b/i.test(c) && /\b(cat|less|more|head|tail|cp|mv|scp|curl|base64|openssl|xxd|strings|grep|rg|awk|sed|open)\b/.test(c)) block('reading or moving key files.');
  if (/(~|\$HOME|\/Users\/[^/\s]+)\/\.(ssh|aws|gnupg|suitecloud-sdk|docker|kube)\b/.test(c) || /\.config\/gcloud\b/.test(c)) block('credential folders are off limits.');
  if (/\bsecurity\s+(find-generic-password|find-internet-password|dump-keychain)\b/.test(c)) block('reading the macOS keychain.');

  // Cloud secret stores and key creation
  if (/\bgcloud\s+secrets\s+versions\s+access\b/.test(c)) block('reading Google Secret Manager values.');
  if (/\bgcloud\s+iam\s+service-accounts\s+keys\s+create\b/.test(c)) block('creating service account keys (use workload identity or ask the user).');
  if (/\bgcloud\s+auth\s+print-(access|identity)-token\b/.test(c)) block('printing Google access tokens.');
  if (/\b(vercel|netlify)\s+env\s+(pull|ls|get)\b/.test(c)) block('pulling hosted environment secrets.');
  if (/\bgh\s+(secret|auth\s+token)\b/.test(c)) block('reading or changing GitHub secrets or tokens.');

  // NetSuite: sandbox only, a person deploys to production
  if (/\bsuitecloud\s+account:(setup|manageauth|savetoken)\b/.test(c)) block('adding or changing NetSuite accounts and auth IDs is done by the user, not Claude.');
  if (/\bsuitecloud\s+project:deploy\b/.test(c)) {
    const authFlag = c.match(/(?:--authid|-i)\s+([^\s;&|]+)/i);
    let authId = authFlag ? authFlag[1] : null;
    if (!authId) {
      try {
        const pj = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'project.json'), 'utf8'));
        authId = pj.defaultAuthId || null;
      } catch (_) { /* no project.json */ }
    }
    if (!authId) block('cannot confirm the deploy target is the sandbox (no auth ID found).');
    if (!/sandbox|^sb\d*$|_sb\d*$|-sb\d*$/i.test(authId)) block(`deploys to "${authId}" are not allowed. Claude deploys to the sandbox only; production deploys are run by a person.`);
  }

  // Git: no pushing to main, no force, no skipping checks
  if (/\bgit\b[^;&|]*\s--no-verify\b/.test(c) || /\bgit\s+commit\b[^;&|]*\s-n\b/.test(c)) block('skipping git hooks (secret scan) is not allowed.');
  if (/\bgit\s+push\b/.test(c)) {
    if (/\s(--force|-f|--force-with-lease|--mirror|--delete|-d)\b/.test(c)) block('force, mirror or delete pushes are not allowed.');
    if (/\s(origin\s+)?(HEAD:)?(main|master|production|prod)\b/.test(c)) block('pushing to main/master/production. Push a branch and open a pull request.');
    try {
      const head = fs.readFileSync(path.join(process.cwd(), '.git', 'HEAD'), 'utf8');
      if (/refs\/heads\/(main|master|production|prod)\s*$/.test(head)) block('you are on main/master; create a branch and open a pull request instead of pushing.');
    } catch (_) { /* not at repo root, branch protection is the backstop */ }
  }
  if (/\bgit\s+(config\s+[^;&|]*core\.hooksPath|filter-branch|filter-repo)\b/.test(c)) block('changing git hooks or rewriting history.');
  if (/\bgh\s+repo\s+(edit[^;&|]*--visibility\s+public|create[^;&|]*--public|delete)\b/.test(c)) block('making repos public or deleting them.');
  if (/\bgh\s+pr\s+merge\b/.test(c)) block('merging pull requests needs a human reviewer.');

  // Publishing, destructive and remote-code commands
  if (/\b(npm|pnpm|yarn)\s+publish\b/.test(c)) block('publishing packages.');
  if (/\brm\s+(-[a-z]*r[a-z]*f|-[a-z]*f[a-z]*r)[a-z]*\s+(\/|~|\$HOME|\.\.)(\s|\/|$)/i.test(c)) block('recursive delete outside the project.');
  if (/\b(curl|wget)\b[^|]*\|\s*(sudo\s+)?(sh|bash|zsh|node|python3?)\b/.test(c)) block('piping downloaded scripts straight into a shell.');
  if (/\bsudo\b/.test(c)) block('sudo is not allowed; ask the user to run it.');
  if (/\b(curl|wget)\b[^;&|]*(\s-d\s*@|--data(-binary|-raw)?[\s=]*@|\s-F\s*\S*=@|\s-T\s|--upload-file)/.test(c)) block('uploading local files to the internet.');
  if (/\b(scp|rsync|sftp|nc|ncat)\b/.test(c)) block('copying files to other machines.');
}

// ---- Main ------------------------------------------------------------------
let raw = '';
process.stdin.on('data', (d) => (raw += d));
process.stdin.on('end', () => {
  let input;
  try { input = JSON.parse(raw || '{}'); } catch (_) { process.exit(0); }
  const tool = input.tool_name || '';
  const t = input.tool_input || {};

  if (tool === 'Bash') {
    checkBash(String(t.command || ''));
  } else if (['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
    const p = t.file_path || t.notebook_path || t.path || '';
    if (isSecretPath(p)) block(`${path.basename(p)} may hold secrets and is off limits.`);
    if (tool !== 'Read' && isProtectedWrite(p)) block(`${path.basename(p)} is a guard-rail file; only the user may change it.`);
  } else if (tool === 'Grep' || tool === 'Glob') {
    const p = t.path || '';
    const pattern = String(t.glob || t.pattern || '');
    if ((p && isSecretPath(p)) || /(^|\/|\*)\.env(\*|$|\.(?!example))/.test(pattern)) block('searching inside secret files.');
  }
  process.exit(0);
});
