# Source Notes: Native Module Failure in CI

The CI job runs `npm rebuild node-pty` and npm prints `rebuilt dependencies
successfully`, but importing `node-pty` still fails because `pty.node` does not
exist. npm also reports that install scripts were blocked by `allowScripts`.

The explanation should help a Node.js maintainer understand that command success
and artifact existence are separate conditions. It should show the expected
install path, locate the blocked script, present the configuration repair, and
finish with a verification that actually imports the module.

Do not explain the full history of Node ABI versions. Do not fabricate terminal
or browser recordings; this example has no capture assets.
