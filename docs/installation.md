Download Console and CLI binaries from the
[latest release](https://github.com/alexanderwanyoike/jolt/releases/latest).
Console starts a local node and lets you manage identities and app permissions.

## Linux

On Debian, Ubuntu or Linux Mint, use the `.deb`:

```sh
sudo apt install ./jolt-console-amd64.deb
```

Install each new `.deb` release the same way. It does not self-update.

The AppImage installer also installs the `jolt` CLI:

```sh
curl -fsSL https://raw.githubusercontent.com/alexanderwanyoike/jolt/main/scripts/install-jolt-console.sh | bash
```

It writes `~/.local/bin/jolt-console` and `~/.local/bin/jolt`. Run it again to update
both, or use Console's in-app update action for the AppImage.

```sh
curl -fsSL https://raw.githubusercontent.com/alexanderwanyoike/jolt/main/scripts/install-jolt-console.sh | bash -s -- --check

curl -fsSL https://raw.githubusercontent.com/alexanderwanyoike/jolt/main/scripts/install-jolt-console.sh | JOLT_VERSION=v0.5.4 bash

jolt-console --appimage-help
jolt --version
```

## macOS and Windows

Use `jolt-console-aarch64.dmg` on Apple silicon or `jolt-console-x86_64-setup.exe`
on Windows. The macOS build is not Apple-signed or notarized. If macOS reports
that the app is damaged after you copy it into Applications:

```sh
xattr -dr com.apple.quarantine "/Applications/Jolt Console.app"
open "/Applications/Jolt Console.app"
```

The release also includes `jolt-macos-aarch64` and `jolt-windows-x86_64.exe` CLI binaries.
The Bash installer installs only the CLI on these platforms; use the DMG or EXE
for Console. Windows requires Git Bash or another Bash-compatible shell to run
the installer script.

## Headless nodes

Install just the CLI for a server or relay:

```sh
curl -fsSL https://raw.githubusercontent.com/alexanderwanyoike/jolt/main/scripts/install-jolt-console.sh | bash -s -- --cli-only
jolt start
```

See the [relay guide](11-relays-and-availability.md) for relay configuration.

## In-app updates

AppImage, macOS and Windows builds verify signed updates before installing them.
Console stops a node it owns if needed, installs the update and relaunches.

`jolt-console-aarch64.app.tar.gz` is the macOS updater payload; the `.dmg` is the
installer. Release assets include signatures, SHA-256 checksums and `latest.json`.
