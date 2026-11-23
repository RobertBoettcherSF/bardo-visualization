# Bardo states

An interactive tour of the Bardo states. The clock, the curves and the mantra syllables are Plain Ada, compiled to WebAssembly. The page draws, and nothing else.

The tour is in UK English. Other languages can be overlaid later. Jung’s reverse order is the default. Lives start in Sidpa and can Follow through the wrathful days and the peaceful days to the Clear Light. Remaining in the primary light is the end of the tour.

## Screen IDs

Every life-wheel screen is `J##-B##`: Jung’s tour position, then the book day. Jung walks toward the Clear Light, so the numbers climb as the book days fall.

| ID | Screen |
| --- | --- |
| J01-B49 | Womb door |
| J02-B42 | Six realm lights |
| J03-B35 | Mirror of karma |
| J04-B28 | Wish-body |
| J05-B14 … J11-B08 | Wrathful days 14 down to 8 |
| J12-B07 … J18-B01 | Peaceful days 7 down to 1 |
| J19-B00 | Secondary Clear Light |
| J20-B00 | Primary Clear Light |

`B` for a Sidpa screen is the last day of that stretch, the day the reverse walk enters it. `B` for a wrathful screen is the book’s own day (8–14), not the calendar day the model uses (11–17). `B` for a peaceful screen is the book’s own day (1–7); the model calendar days are 4–10. Colours come from `data/iconography.json`. Where that table marks a colour or a name uncertain, the detail panel says so. Buddha Heruka is painted maroon: the root text says dark brown, and the table’s outside note says maroon-red.

Endings hang off the womb with a suffix: `J01-B49/good` and `J01-B49/deva`, `asura`, `human`, `animal`, `preta`, `hell`. Remaining in the primary Clear Light is `J20-B00/liberation`. The opening is `OPEN`. The clock before day 22 is `CLOCK`. `B00` is the Clear Light, before book day 1. The primary light is the first hours of the model clock. The secondary light is still calendar day 0, just after those hours.

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
