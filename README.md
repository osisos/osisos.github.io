# github.io

Personal Hugo blog at https://osisos.github.io/.

Uses the MIT-licensed [LoveClaude](https://github.com/wangsirco/loveclaude) theme,
pinned as a Git submodule. Hugo extended 0.146.0 is used for local builds and deployment.

```sh
git submodule update --init --recursive
hugo server
```

Add posts under `content/posts/`. Push to `main` to deploy via GitHub Pages.

Site overrides preserve the upstream design while supplying system serif font
fallbacks (the theme omits its referenced font files), honoring the configured
light default, and removing author-specific demo text and unavailable page links.
Old posts and generated pages were removed; generated output is no longer tracked.
