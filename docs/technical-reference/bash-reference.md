# Bash Command Reference

## Critical

* Handy keyboard commands:
  ```text
  [CTRL]+C              stop a running command
  [ESC],[SHIT]+ZZ       exit interactive text doc
  [UP]                  show previous command. Typed letters are the search prefix
  ```
* Where am I?: `pwd` (Print Working Directory)
* List files: `ls` (List)
* Detailed listing: `ls -lah` (`-l` = long format, `-a` = all, including hidden files, `-h` human-readable)
* Change directory: `cd directory` (Change Directory)
* Change to parent directory: `cd ..` (`..` means parent directory)
* Go home: `cd ~` (`~` means the user's home directory)
* Return to the previous directory: `cd -`
* Create a directory: `mkdir dirname` (make directory)
* Create nested directories: `mkdir -p path/to/directory` (`-p` = parents)
* Create an empty file: `touch filename` (`touch` updates a file's timestamp; if the file doesn't exist, it creates it.)
* Print a file: `cat filename` (concatenate)
* Print first lines: `head -n 25 filename`
* Print last lines: `tail -n 25 filename`
* Copy a file: `cp source destination` (copy)
* Copy a directory: `cp -r source_dir destination_dir` (`-r` = recursive)
* Move / rename: `mv oldname newname` (move)
* Delete a file: `rm filename` (remove)
* Delete a directory and its contents: `rm -r directory` (`-r` = recursively)
* Delete without asking: `rm -f filename` (`-f` = force)
* Windows
  * Location of Windows drive: `/mnt/c/`
* Show previous commands: `history`
* Search history: `history | grep ruff`
  * Similarly, you can use `[CTRL]+r` and search your command history
* Run a command as admin: `sudo command`
* Show the manual for a command: `man command`
* Common help flag: `command --help`

## Handy

* Handy keyboard commands:
  ```text
  Ctrl+D            exit shell / EOF
  Ctrl+R            search command history
  Ctrl+L            clear terminal
  ```
* Searching: 
  * Files only: `find . -f -name "filename"`
  * Directories only: `find . -d -name "dirname"`
  * Wildcards: `find ./src -name "*.py"`
* Search file contents: (Global Regular Expression Print)
  * Simple: `grep "Book" src/schemas.py`
  * Recursive: `grep -R "Book" src/` (`-R` = recursive)
  * Show line numbers: `grep -n "class Book" src/schemas.py` (`-n` = line number)
  * Case-insensitive: `grep -i "book" filename` (`-i` = ignore case)
* Terminal file editor: `vim filename` (Vi IMproved)
* Running files:
  * Run a Python file: `python filename.py` or `uv run puthon filename.py`
  * Run a bash file: `bash filename.sh`
  * Run an executable file: `./filename`
    * `..` means: "the file named `filename` in the current directory."
* Git
  * Check git status: `git status`
  * Update your machine's understanding of the remote: `git fetch`
  * Update the local to match the remote: `git pull`
  * Stage all changes for committing: `git add .`
  * Commit with a message: `git commit -m "Present tense summary with no trailing period"`
  * Update the remote with recent commits: `git push`
  * Make a new branch and switch to it: `git checkout -b branch-name`
  * Project-Specific "I'm About to Commit" Workflow:
    * ````bash
      # [make changes]
      git fetch
      git status
      make lint
      make test
      git status
      git add .
      git commit -m "Describe the change"
      git push
      ````
  * Ensure that the current machine always uses Linux line endings:
    * `git config --global core.autocrlf false && git config --global core.eol lf`
    * You also want a `.gitattributes` filein the repo.
* Python3
  * Activate a virtual environment in the current directory: `source .venv/bin/activate`
  * Check Python version: `python --version` or `python -V`
  * Open a Python REPL: `uv run python` or `python3`
  * See installed packages: `uv pip list`
  * Add a dependency: `uv add package-name`
  * Add development dependency: `uv add --dev package-name`
* HTTP
  * Test a URL: `curl http://127.0.0.1:8000/health` ("Client URL")
  * Send an Authorization header:
    * ```bash
      curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://127.0.0.1:8000/books
      ```
    * Ending a line with `\` means: "this command continues on the next line."
* Windows
  * Open the current directory in Windows Explorer: `explorer.exe .`

## Good to Know

* Check your current Linux environment: `uname -a`
* Print the name of the current user: `whoami`
* Print the name of the current device: `hostname`
* Print the name of the current shell: `echo $SHELL`
* Print the current environment variables: `printenv`
* Print current running processes: `ps aux`
* See if a specific process is running: `ps aux | grep uvicorn`
  * The `|` is the pipe. It means: Take the output of the command on the left and feed it into the command on the right.
  * So this means: List processes, and then search *only that output* for `uvicorn`.
* Kill a process: `kill PID`. E.g.: `kill 12345`
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

# Linux Conventions

* Files should always end in a trailing newline character.
* Windows uses different line endings than Linux. When straddling the OSes, Linux line endings are preferred.
* Naming conventions:
  * In Linux projects, it's conventional to use lowercase for filenames and directories.
  * Windows doesn't like filenames or folder names that end in a period (e.g., `foo..md`).
  * In git, renaming files or folders to only change casing (e.g., `foo` to `Foo`) is not recognized.
  * In Python projects, it's conventional to use snake_case for filenames and directories.
  * Avoid special characters in filenames and folder names:
    * `!`, `"`, `$`, `%`, `*`, `:`, `;`, `<`, `>`, `?` `~`, `\`, `|`, and the backtick (i.e., '`') itself
* Casing strategies by name:
  * snake_case: Use lowercase letters and underscores to separate words.
  * kebab-case: Use lowercase letters and hyphens to separate words.
  * PascalCase: Use lowercase letters and no separators; capitalized the first letter of each word.
  * camelCase: Use lowercase letters and no separators; capitalized the first letter of each word except the first word.
