/**
 * Claude Code hook that keeps the main worktree on `main`.
 *
 * Work on another branch belongs in its own `git wt` worktree; switching
 * branches in the main worktree is how edits end up on the wrong branch.
 * Rather than parsing shell commands, which has endless bypasses, this hook
 * checks the main worktree's actual state:
 *
 * - PostToolUse (Bash): right after a command, report when the main worktree
 *   has left `main`, so the switch is undone before anything is edited.
 * - PreToolUse (Edit, Write, NotebookEdit): refuse to edit a file in the main
 *   worktree while it is not on `main`.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

type HookInput = {
  hook_event_name?: string;
  cwd?: string;
  tool_input?: { file_path?: string; notebook_path?: string };
};

const input = JSON.parse(await Bun.stdin.text()) as HookInput;
const cwd = input.cwd ?? process.cwd();

function git(dir: string, ...args: string[]): string | undefined {
  const result = spawnSync('git', ['-C', dir, ...args], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

/** True when `file` is `dir` itself or somewhere below it. */
function isInside(file: string, dir: string): boolean {
  const relative = path.relative(dir, file);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

// The first entry of `git worktree list` is always the main worktree.
const worktrees = (git(cwd, 'worktree', 'list', '--porcelain') ?? '')
  .split('\n')
  .filter((line) => line.startsWith('worktree '))
  .map((line) => line.slice('worktree '.length));
const [mainWorktree, ...linkedWorktrees] = worktrees;
if (mainWorktree === undefined) process.exit(0);

// `symbolic-ref` fails on a detached HEAD, which is also not `main`.
const branch = git(mainWorktree, 'symbolic-ref', '--quiet', '--short', 'HEAD');
if (branch === 'main') process.exit(0);

const state = branch === undefined ? 'a detached HEAD' : `branch ${branch}`;
const advice =
  `Switch it back with \`git -C ${mainWorktree} switch main\`, ` +
  'and do branch work in its own worktree: `git wt --nocd <branch>` (see AGENTS.md).';

if (input.hook_event_name === 'PostToolUse') {
  console.error(`The main worktree (${mainWorktree}) is on ${state}, not main. ${advice}`);
  process.exit(2);
}

if (input.hook_event_name === 'PreToolUse') {
  const target = input.tool_input?.file_path ?? input.tool_input?.notebook_path;
  if (target === undefined) process.exit(0);
  const file = path.resolve(cwd, target);
  // Linked worktrees such as `.wt/<branch>` may live inside the main one.
  const inMain = isInside(file, mainWorktree) && !linkedWorktrees.some((dir) => isInside(file, dir));
  if (inMain) {
    console.error(`Blocked: ${file} is in the main worktree, which is on ${state}, not main. ${advice}`);
    process.exit(2);
  }
}
