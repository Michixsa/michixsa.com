/**
 * Claude Code PreToolUse hook for Bash.
 *
 * Blocks creating or switching branches inside the main worktree, so that a
 * branch is always paired with its own `git wt` worktree. Switching changes
 * in the main worktree is how edits end up on the wrong branch.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

type HookInput = { cwd?: string; tool_input?: { command?: string } };

const input = JSON.parse(await Bun.stdin.text()) as HookInput;
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();

function git(dir: string, ...args: string[]): string | undefined {
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

/** The main worktree is the only one whose git dir is the common dir. */
function isMainWorktree(dir: string): boolean {
  const gitDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-dir');
  const commonDir = git(dir, 'rev-parse', '--path-format=absolute', '--git-common-dir');
  return gitDir !== undefined && gitDir === commonDir;
}

const createFlags = new Set(['-c', '-C', '-b', '-B', '--create', '--force-create', '--orphan']);

/** Returns why the git invocation must be blocked, or undefined to allow it. */
function violation(args: string[], dir: string): string | undefined {
  const [subcommand, ...rest] = args;
  if (subcommand !== 'switch' && subcommand !== 'checkout') return undefined;
  if (rest.some((arg) => createFlags.has(arg))) return 'creates a branch';
  // `git checkout -- <path>` restores files; everything after `--` is a path.
  const positional = rest.slice(0, rest.includes('--') ? rest.indexOf('--') : undefined);
  const target = positional.find((arg) => !arg.startsWith('-'));
  if (target === undefined || target === 'main') return undefined;
  if (subcommand === 'switch') return `switches to ${target}`;
  // For checkout, only a local branch name counts; anything else is a path.
  const isBranch = git(dir, 'show-ref', '--verify', '--quiet', `refs/heads/${target}`) !== undefined;
  return isBranch ? `switches to ${target}` : undefined;
}

// Split the shell command into simple commands; quoting is ignored because
// branch names and the flags we look for never contain spaces.
for (const segment of command.split(/&&|\|\||[;|\n]/)) {
  const tokens = segment.trim().split(/\s+/);
  const gitIndex = tokens.indexOf('git');
  if (gitIndex === -1) continue;
  let dir = cwd;
  let i = gitIndex + 1;
  // Skip global options before the subcommand, honouring `-C <dir>`.
  while (i < tokens.length && tokens[i].startsWith('-')) {
    if (tokens[i] === '-C' && i + 1 < tokens.length) {
      dir = path.resolve(dir, tokens[i + 1]);
      i += 2;
    } else {
      i += 1;
    }
  }
  const reason = violation(tokens.slice(i), dir);
  if (reason !== undefined && isMainWorktree(dir)) {
    console.error(
      `Blocked: this ${reason} in the main worktree (${dir}). ` +
        'Keep the main worktree on main and create the branch with its own worktree: ' +
        '`git wt --nocd <branch>`, then work in the printed path (see AGENTS.md).',
    );
    process.exit(2);
  }
}
