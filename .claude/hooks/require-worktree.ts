/**
 * Claude Code PreToolUse hook for Bash.
 *
 * Blocks creating or switching branches inside the main worktree, so that a
 * branch is always paired with its own `git wt` worktree. Switching changes
 * in the main worktree is how edits end up on the wrong branch.
 */
import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

type HookInput = { cwd?: string; tool_input?: { command?: string } };

const input = JSON.parse(await Bun.stdin.text()) as HookInput;
const command = input.tool_input?.command ?? '';
const cwd = input.cwd ?? process.cwd();

const shells = new Set(['sh', 'bash', 'zsh', 'fish', 'dash']);
// Words that can precede the program of a simple command: wrappers that run
// their arguments, and shell keywords that open a control block.
const prefixes = new Set([
  'command', 'builtin', 'env', 'exec', 'time', '!', '{',
  'if', 'then', 'elif', 'else', 'while', 'until', 'do',
  'begin', 'and', 'or', 'not',
]);

/** One simple command, or the start or end of a subshell. */
type Token = string[] | '(' | ')';
// Global git options whose value is the next word.
const gitOptionsWithValue = new Set(['-c', '--git-dir', '--work-tree', '--namespace', '--config-env']);

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

/**
 * Splits a shell script into simple commands, each a list of words with the
 * quoting removed. Variables and command substitutions are left unexpanded.
 */
function parseCommands(script: string): Token[] {
  const commands: Token[] = [];
  let words: string[] = [];
  let word = '';
  // Tracks whether a word has started, so that '' still counts as a word.
  let inWord = false;
  const endWord = () => {
    if (inWord) words.push(word);
    word = '';
    inWord = false;
  };
  const endCommand = () => {
    endWord();
    if (words.length > 0) commands.push(words);
    words = [];
  };
  for (let i = 0; i < script.length; i++) {
    const ch = script[i];
    if (ch === "'") {
      // Single quotes keep everything literally up to the closing quote.
      const close = script.indexOf("'", i + 1);
      const end = close === -1 ? script.length : close;
      word += script.slice(i + 1, end);
      inWord = true;
      i = end;
    } else if (ch === '"') {
      // Double quotes treat a backslash as an escape only before " \ $ `.
      inWord = true;
      for (i++; i < script.length && script[i] !== '"'; i++) {
        if (script[i] === '\\' && '"\\$`'.includes(script[i + 1] ?? '')) i++;
        if (i < script.length) word += script[i];
      }
    } else if (ch === '\\') {
      // An unquoted backslash escapes the next character, and joins lines
      // when that character is a newline.
      if (script[i + 1] !== '\n') {
        word += script[i + 1] ?? '';
        inWord = true;
      }
      i++;
    } else if (ch === ' ' || ch === '\t') {
      endWord();
    } else if ('\n;&|()'.includes(ch)) {
      // Operators and parentheses end the current simple command; parentheses
      // (including `$(`) are kept so that a `cd` inside them stays inside.
      endCommand();
      if (ch === '(' || ch === ')') commands.push(ch);
    } else if (ch === '#' && !inWord) {
      // A comment runs to the end of the line.
      const newline = script.indexOf('\n', i);
      i = newline === -1 ? script.length : newline - 1;
    } else {
      word += ch;
      inWord = true;
    }
  }
  endCommand();
  return commands;
}

/** Drops redirections such as `>/dev/null`, `2>` and `< file`. */
function stripRedirections(words: string[]): string[] {
  const kept: string[] = [];
  for (let i = 0; i < words.length; i++) {
    const match = /^\d*[<>]+/.exec(words[i]);
    if (match === null) kept.push(words[i]);
    // A bare operator takes its target from the next word.
    else if (match[0] === words[i]) i++;
  }
  return kept;
}

/** Resolves the directory a `cd` with these arguments moves to. */
function changeDir(dir: string, args: string[]): string {
  const target = args.find((arg) => !arg.startsWith('-') || arg === '-');
  if (target === undefined || target === '~') return os.homedir();
  // `cd -` returns to a directory this parser cannot know; keep the current one.
  if (target === '-') return dir;
  if (target.startsWith('~/')) return path.join(os.homedir(), target.slice(2));
  return path.resolve(dir, target);
}

/** True when `name` names a commit or a remote branch that checkout would track. */
function isRef(dir: string, name: string): boolean {
  if (git(dir, 'rev-parse', '--verify', '--quiet', `${name}^{commit}`) !== undefined) return true;
  return (git(dir, 'for-each-ref', '--count=1', `refs/remotes/*/${name}`) ?? '') !== '';
}

/** Returns why `git switch` / `git checkout` must be blocked, or undefined to allow it. */
function violation(args: string[], dir: string): string | undefined {
  const [subcommand, ...rest] = args;
  if (subcommand !== 'switch' && subcommand !== 'checkout') return undefined;
  // Short creation flags may be clustered or carry a joined value (`-bname`);
  // long ones may use `--create=name`.
  const createsBranch = rest.some(
    (arg) => /^-[^-]*[cCbB]/.test(arg) || /^--(create|force-create|orphan)(=|$)/.test(arg),
  );
  if (createsBranch) return 'creates a branch';
  const separator = rest.indexOf('--');
  const options = separator === -1 ? rest : rest.slice(0, separator);
  const positional = options.filter((arg) => arg === '-' || !arg.startsWith('-'));
  // For switch, `--` only ends the options, so the branch may follow it.
  if (subcommand === 'switch' && separator !== -1) positional.push(...rest.slice(separator + 1));
  // `git checkout [<tree-ish>] [--] <path>…` restores files without moving HEAD.
  if (subcommand === 'checkout') {
    const hasPathsAfterSeparator = separator !== -1 && separator < rest.length - 1;
    if (hasPathsAfterSeparator || positional.length > 1) return undefined;
  }
  let target = positional[0];
  if (target === undefined || target === 'main') return undefined;
  if (target === '-') {
    // `-` means the previously checked-out branch.
    const previous = git(dir, 'rev-parse', '--abbrev-ref', '@{-1}');
    if (previous === undefined || previous === 'main') return undefined;
    target = previous;
  } else if (subcommand === 'checkout' && !isRef(dir, target)) {
    // Anything checkout cannot resolve as a ref is a path to restore.
    return undefined;
  }
  return `switches to ${target}`;
}

/** Inspects one git invocation and returns why it must be blocked, if it must. */
function checkGit(args: string[], dir: string): string | undefined {
  let gitDir = dir;
  let i = 0;
  // Skip global options before the subcommand, honouring `-C <dir>`.
  while (i < args.length && args[i].startsWith('-')) {
    if (args[i] === '-C') gitDir = path.resolve(gitDir, args[i + 1] ?? '');
    i += args[i] === '-C' || gitOptionsWithValue.has(args[i]) ? 2 : 1;
  }
  const reason = violation(args.slice(i), gitDir);
  return reason !== undefined && isMainWorktree(gitDir) ? `${reason} in the main worktree (${gitDir})` : undefined;
}

/** Walks a shell script command by command, following `cd` and nested shells. */
function check(script: string, startDir: string, depth = 0): string | undefined {
  let dir = startDir;
  // Directories to return to when each open subshell ends.
  const outer: string[] = [];
  for (const token of parseCommands(script)) {
    if (token === '(') {
      outer.push(dir);
      continue;
    }
    if (token === ')') {
      dir = outer.pop() ?? dir;
      continue;
    }
    const words = stripRedirections(token);
    // Skip leading `VAR=value` assignments, wrappers and control keywords.
    let i = 0;
    while (i < words.length && (/^[A-Za-z_]\w*=/.test(words[i]) || prefixes.has(words[i]))) i++;
    const [name, ...args] = words.slice(i);
    if (name === undefined) continue;
    const program = path.basename(name);
    if (program === 'cd') {
      dir = changeDir(dir, args);
    } else if (program === 'git') {
      const reason = checkGit(args, dir);
      if (reason !== undefined) return reason;
    } else if (shells.has(program) && depth < 3) {
      // `bash -lc '<script>'` or `fish --command '<script>'`: the script is the
      // word after the first option that contains `c`.
      const flag = args.findIndex((arg) => /^-[a-z]*c[a-z]*$/.test(arg) || arg === '--command');
      const nested = flag === -1 ? undefined : args[flag + 1];
      const reason = nested === undefined ? undefined : check(nested, dir, depth + 1);
      if (reason !== undefined) return reason;
    }
  }
  return undefined;
}

const reason = check(command, cwd);
if (reason !== undefined) {
  console.error(
    `Blocked: this ${reason}. ` +
      'Keep the main worktree on main and create the branch with its own worktree: ' +
      '`git wt --nocd <branch>`, then work in the printed path (see AGENTS.md).',
  );
  process.exit(2);
}
