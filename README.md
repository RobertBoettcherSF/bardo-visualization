# Bardo states

An interactive tour of the Bardo states. The clock, the curves and the mantra syllables are Plain Ada, compiled to WebAssembly. The page draws, and nothing else.

The tour is in UK English. Other languages can be overlaid later. Jung’s reverse order is the default. Item 2 adds the four Sidpa scenes (womb, six lights, judgement, wish-body), a fixed Previous / Start / Next bar, and a browser-generated soundscape that stays off until Sound is tapped. Wrathful days, peaceful days, and the Clear Light scenes are not in this build.

## Build

The build uses the shared AdaWebPack at `$ADAWEBPACK` or `~/toolchains/adawebpack-24`. It stops if that directory is missing. It does not download a toolchain. `tools/get-toolchain.sh` is opt-in and installs there only after you agree to the download.

```sh
./build.sh
```

`build.sh` writes `index.html` and `version.txt`. The stamp is `v0.1 bYYYYMMDD-HHMM <sha>` in Europe/Berlin, with a trailing `+` if the tree was dirty. The same string is on the page.

## Test

```sh
./run-tests.sh
```

That compiles `tests/smoke.gpr` with `-gnat2022 -gnata -gnatwa -gnatwe` (warnings fail the build), checks that `libgnat` is not dynamically linked, runs the smoke, and runs `node tests/graphemes.mjs`.

The browser smoke needs Chrome and `puppeteer-core`:

```sh
npm install
node tests/browser/smoke.mjs
```

## Page

Open `index.html`. The font is the sibling file `assets/devanagari-subset.woff2`. Wasm is instantiated from the bytes embedded in the page.

The MIT licence covers this code. The page itself carries no copyright note. The words on the page are ours, checked against the Evans-Wentz book (public domain) and a private German working text that is not in this repository.
