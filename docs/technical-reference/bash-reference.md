# Bash / Linux Reference

## What am I using?

* A **terminal** is the application/window where you type commands.
* A **shell** (such as Bash or ZSH) reads those commands and runs them.
* A **virtual machine** is a simulated computer that runs using the host machine's hardware.
* **WSL2** is an application (and subsystem/platform) for Windows that manages and runs Ubuntu in a virtual machine.
  * WSL2 can also run other OSes, but don't worry about that for now.
* **Ubuntu** is the operating system running inside WSL.
* **Linux** is the kernel that Ubuntu uses.
* The **kernel** is the core portion of an OS that interfaces with the hardware.
* **Unix** is the broader family/tradition that Linux is largely modeled after.

### Linux conventions

* Files should always end in a trailing newline character.
* Windows uses different line endings than Linux. When straddling the OSes, Linux line endings are preferred.
* On Unix systems (e.g., Linux), files are sorted according to ASCII value. This means that all uppercase letters come
  before any lowercase letters.
* Naming conventions:
  * In Linux projects, it's conventional to use lowercase for normal filenames and normal directories.
  * In Linux projects, it's conventional to use UPPERCASE for filenames and directories that are intended to stand out.
  * Windows doesn't like filenames or folder names that end in a period (e.g., `foo..md`).
  * In git, renaming files or folders to only change casing (e.g., `foo` to `Foo`) is not recognized.
  * In Python projects, it's conventional to use snake_case for filenames and directories.
  * Avoid special characters in filenames and folder names:
    * `!`, `"`, `$`, `%`, `*`, `:`, `;`, `<`, `>`, `?` `~`, `\`, `|`, and the backtick (i.e., '`') itself
* Casing strategies by name:
  * snake_case: Use lowercase letters and underscores to separate words.
  * kebab-case: Use lowercase letters and hyphens to separate words.
  * PascalCase: No separators, only the first letter of each word is capitalized.
  * camelCase: No separators, first word is lowercase, then subsequent words only have the first letter capitalized.

### Windows paths from WSL

* Location of Windows drive: `/mnt/c/`
* Open a file in Notepad on Windows: `notepad.exe relative/path/to/filename.txt`
* Open the current directory in Windows Explorer: `explorer.exe .`

---

## Keyboard cheat sheet


```text
[CTRL]+C              stop a running command
[ESC], [SHIFT]+ZZ     exit interactive text doc (e.g., vim)
[UP]                  show previous command. Typed letters are the search prefix
[TAB]                 autocomplete
[CTRL]+D              exit shell / EOF
[CTRL]+R              search command history interactively
[CTRL]+L              clear terminal
```

---

## How do paths work?

* `/`                  filesystem root
* `~`                  your home directory
* `.`                  current directory
* `..`                 parent directory
* `/foo`               absolute path (starts at `/`)
* `foo/bar`            relative path (starts from where you are)

---

## Everyday navigation

* Where am I?: `pwd` (Print Working Directory)
* List files: `ls` (List)
* Detailed listing: `ls -lah` (`-l` = long format, `-a` = all, including hidden files, `-h`
  human-readable)
* Change directory: `cd directory` (Change Directory)
  * Note that if the directory path contains a space, then it'll need to be quoted: `cd "/foo/Saved Prompts/"`
  * Also note that things like `~` and `*` don't work **inside** double quotes: `ls "/foo/Saved Prompts/"*`
* Change to parent directory: `cd ..` (`..` means parent directory)
* Go home: `cd ~` (`~` means the user's home directory)
* Return to the previous directory: `cd -` (`-` means previous directory)
* Tab autocomplete: press `[TAB]` to complete paths and command names
* Show previous commands: `history`
* Search history: `history | grep ruff`
* Interactive history search: `[CTRL]+R` (see [Keyboard cheat sheet](#keyboard-cheat-sheet))

---

## Files and directories

* Create a directory: `mkdir dirname` (make directory)
* Create nested directories: `mkdir -p path/to/directory` (`-p` = parents)
* Create an empty file: `touch filename` (`touch` updates a file's timestamp; if the file doesn't exist,
  it creates it.)
* Print a file: `cat filename` (concatenate)
* Print first lines: `head -n 25 filename` (`-n` means number of lines)
* Print last lines: `tail -n 25 filename` (`-n` means number of lines)
* Copy a file: `cp source destination` (`cp` = copy)
* Copy a directory: `cp -r source_dir destination_dir` (`-r` = recursive)
* Move / rename: `mv oldname newname` (`mv` = move)
* Delete a file: `rm filename` (`rm` = remove)
  * Delete a directory and its contents: `rm -r directory` (`-r` = recursively)
  * Be careful with `rm`: there is no recycle bin or undo. Double-check the path before recursively and/or forcibly
    deleting anything.
* Delete without asking: `rm -f filename` (`-f` = force)
* Terminal file editor: `vim filename` (Vi IMproved. `vi` is an older text editor on Unix systems)
  * Exit with `[ESC]`, then `[SHIFT]+ZZ`, or `:q!` to quit without saving

---

## Finding things

* Searching with `find`:
  * Files only: `find . -type f -name "filename"`
  * Directories only: `find . -type d -name "dirname"`
  * Wildcards: `find ./src -name "*.py"`
* Search file contents with `grep` (Global Regular Expression Print):
  * Simple: `grep "Book" src/schemas.py`
  * Recursive: `grep -R "Book" src/` (`-R` = recursive)
  * Show line numbers: `grep -n "class Book" src/schemas.py` (`-n` = line number)
  * Case-insensitive: `grep -i "book" filename` (`-i` = ignore case)
* Edit/transform text with `sed` (Stream EDitor):
  * Replace the first occurrence on each line: `sed 's/old/new/' filename`
  * Replace all occurrences: `sed 's/old/new/g' filename` (`g` = global, meaning all matches on each line)
  * Edit the file in place: `sed -i 's/old/new/g' filename` (`-i` = in-place)
  * Delete matching lines: `sed '/pattern/d' filename`
  * Print a range of lines: `sed -n '10,20p' filename` (`-n` = suppress normal output; `p` = print)
  * `sed` uses regular expressions, so some characters have special meaning. 
  * Preview a change before modifying the file by leaving off `-i`:
    ```bash
    sed 's/old/new/g' filename
    # If the output looks right:
    sed -i 's/old/new/g' filename
    ```


---

## Running programs


* Run a command as admin: `sudo command` (`sudo` = SUperuser DO)
* Show the manual for a command: `man command` (`man` = manual)
* Common help flag: `command --help`
* Run a Python file: `python filename.py` or `uv run python filename.py`
* Run a bash file: `bash filename.sh`
* Run an executable file: `./filename`
  * `.` means: "the current directory."
* Ending a line with `\` means: "this command continues on the next line."
  * The convention is to indent subsequent lines until the command is complete

---

## Git workflow

* Check git status: `git status`
* Update your machine's understanding of the remote: `git fetch`
* Update the local branch to match the remote: `git pull`
* Stage all changes for committing: `git add .`
* Commit with a message: `git commit -m "Present tense summary with no trailing period"`
* Update the remote with recent commits: `git push`
* Create a new branch and switch to it: `git switch -c branch-name`
* Project-specific "I'm about to commit" workflow:

  ```bash
  # [make changes]
  git fetch
  git status
  make lint
  make test
  git status
  git add .
  git commit -m "Describe the change"
  git push
  ```

* Ensure that the current machine always uses Linux line endings:
  * `git config --global core.autocrlf false && git config --global core.eol lf`
  * You also want a `.gitattributes` file in the repo.
* Pull a file from another branch without switching branches:
  * `git checkout chore/tidy -- docs/prompt-master-context.md`

---

## Python project workflow

* Activate a virtual environment in the current directory: `source .venv/bin/activate`
* Check Python version: `python --version` or `python -V`
* Open a Python REPL: `uv run python` or `python3`
* See installed packages: `uv pip list`
* Add a dependency: `uv add package-name`
* Add development dependency: `uv add --dev package-name`

---

## HTTP / debugging

* Test a URL: `curl http://127.0.0.1:8000/health` ("Client URL")
* Send an Authorization header:

  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
    http://127.0.0.1:8000/books
  ```

---

## Troubleshooting / good to know

* Check your current Linux environment: `uname -a`
* Print the name of the current user: `whoami`
* Print the name of the current device: `hostname`
* Print the name of the current shell: `echo $SHELL`
* Print the current environment variables: `printenv`
* Print current running processes: `ps aux`
* See if a specific process is running: `ps aux | grep uvicorn`
  * The `|` is the pipe. It means: Take the output of the command on the left and feed it into the command on the right.
  * So this means: List processes, and then search *only that output* for `uvicorn`.
* Kill a process: `kill PID`. E.g., `kill 12345`
* Force-kill a process: `kill -9 PID`
* Print the output of a command to a file:
  * Overwrite: `command > file.txt`
  * Append: `command >> file.txt`
  * Redirect errors: `command 2> errors.txt`
    * `2` is the standard error stream.
  * Redirect everything: `command > output.txt 2>&1`
    * Meaning: send normal output to `output.txt`, then send errors to the same place.
* Show disk usage: `df -h` (`df` = disk filesystem usage. `-h` = human-readable)
* Show directory size: `du -sh directory` (`du` = disk usage. `-s` = summary. `-h` = human-readable)

---

## Editing Text in the CLI

* `nano filename`: Simple, beginner-friendly text editor that runs inside the terminal.
  * Commands are shown at the bottom of the screen; `^` means `[CTRL]`.
  * Save: `[CTRL]+O`, then `[ENTER]`
  * Exit: `[CTRL]+X`
  * Search: `[CTRL]+W`
  * `[ESC]`, `[SHIFT]+ZZ` does not exit `nano`. Use `[CTRL]+X`.
* `vim filename`: Powerful text editor with separate modes for navigating and editing.
  * Start editing: press `i` to enter **Insert mode**.
  * Stop editing: press `[ESC]` to return to **Normal mode**.
  * Save and exit: `[ESC]`, then type `:wq` and press `[ENTER]`.
  * Exit without saving: `[ESC]`, then type `:q!` and press `[ENTER]`.
  * If you're stuck in Vim, `[ESC]` followed by `:q!` and `[ENTER]` will usually get you out.
  * `[ESC]`, `[SHIFT]+ZZ` saves (if necessary) and exits `vim`.
* `less`: A pager used by commands such as `journalctl`, `man`, and sometimes `git` to let you navigate output one
  screen at a time.
  * If a command appears to stop on a screen of output, you may be inside `less`.
  * Exit: `q`
  * Scroll: arrow keys, `[PAGE UP]`, and `[PAGE DOWN]`
  * Search forward: `/text`, then `[ENTER]`
  * Next search result: `n`
  * Previous search result: `[SHIFT]+N`
  * Many commands support `--no-pager` to print their output normally instead (e.g., `journalctl --no-pager`).
  * For commands that don't have a `--no-pager` option, piping through `cat` will often prevent paging: `command | cat`
  * `[ESC]`, `[SHIFT]+ZZ` is not the normal way to exit `less`, but it will work

