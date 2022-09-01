# Next-Version

CLI Tool to increment project version in files.

[Find out more!](https://npm.christophervachon.com/-/web/detail/@christophervachon/next-version)

## Usage

-   Download the repository.
-   Install the dependancies with `Yarn` or `NPM` - `npm install`
-   Use `npm link` to make the project globally accessible

### Alternative

If you are using a node version control manager such as [nvm](https://github.com/nvm-sh/nvm). It may be easier to create a function in your `.bashrc` or `.zshrc` file pointing at the installed project.

```sh
function next-version() {
    node [path-to-repository]/next-version/index.js
}
```
