# CodeSlap

If you're like me and you find yourself ssh'ing into a prod console on a daily basis to do some debugging or run once-off scripts, you probably hate your life.
And if the high latency of ssh connections means that you never, EVER, manage to type `Organisationalunit` right the first time, you probably also hate _yourself_.

If you're not lazy you might push to get [mosh](https://github.com/mobile-shell/mosh) installed on your workplace's servers but if you're like me: you _are_ lazy.

CodeSlap lets you push commands to your terminal session from the comfort of a text editor, as if you were directly typing into the terminal itself. The editor is powered by [CodeMirror](https://github.com/codemirror/CodeMirror) meaning familiar keybindings, multi-cursors, and easy navigation.

## Usage

Press `shift+tab` to toggle between CodeSlap and the application you want to push commands to. Type a command and press `enter` and it will be pushed to your terminal (or whichever application was last focused).

![demo](./github_assets/demo4.gif)

## Installation

Currently for OSX only: you can download the zip file from the releases section. Drag the application to your applications folder.

You will need to allow CodeSlap to 'control your computer' (so that it can switch focus and push your commands to the terminal) like so:

![](https://i.imgur.com/sFbpCvi.png)

If CodeSlap does not appear in the list, you can add it manually via the `+` button.

## Settings

![](https://i.imgur.com/x88QkOT.png)

### Strip whitespace before period when pasting

Disabled by default.

When this option is enabled, a command like the following:

```
Author
  .find_by(id: 123)
  .name
```

will be converted to `Author.find_by(id: 123).name` when pushing to the terminal. This is useful in a language like Ruby where you would otherwise need to wrap your command in a `begin`/`end` block.

### Single line mode

Enabled by default.

When this option is enabled, the up and down arrow keys will go back and forwards through your command history, and pressing `enter` will push the command.

Whent the option is disabled, the up and down arrow keys will move your cursor and instead you can use `cmd+j` and `cmd+k` to traverse the command history. Pressing `enter` will create a newline, and `shift+enter` will push the command.

### Syntax colouring

Colours your syntax.

### Glob for hints and autocomplete

If you enter a glob into this input and press `sync`, all files matching that glob will be scanned for frequent words and those words will be extracted for use in hinting.

## Really Unimpressed Netizen (RUN) Q&A:

> RUN: I'm unimpressed. If the point of this app is to circumvent latency issues when ssh'ing into a remote console, doesn't this just move the latency from a per-character delay to a larger delay when you try to push the command?
>
> CodeSlap: The main idea behind my existence is to reduce typos caused by latency. Nobody has ever made a typo due to intermittent latency that occurs _after_ the command is typed. And I think you'll find the latency upon pushing the command is unnoticeable, unless your connection is really bad. And if youre connection is really bad, typing commands directly will be even _more_ of a pain.
>
> RUN: But Mosh already solves this problem with optimistic rendering of keystrokes.
>
> CodeSlap: Mosh indeed solves the latency problem, but it requires setup both client-side and server-side. It also lacks many of my cool features like multiline editing, multi-cursors and hints.
>
> RUN: Well many of those things could arrive soon enough inside terminals, for example the Ruby REPL will soon have multiline support
>
> CodeSlap: My creator is too impatient to wait for things like that.
>
> RUN: I'll get you one day CodeSlap. You haven't seen the last of me.
