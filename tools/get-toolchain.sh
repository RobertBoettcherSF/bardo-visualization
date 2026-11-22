#!/bin/sh
# Opt-in. Run only after agreeing to the download. Installs one shared
# AdaWebPack under ~/toolchains/adawebpack-24. Never into this repo.
set -eu
DEST=${ADAWEBPACK:-$HOME/toolchains/adawebpack-24}
case "$DEST" in
  "$PWD"|"$PWD"/*) echo "Refusing to install the toolchain inside the repo." >&2; exit 1 ;;
esac
mkdir -p "$DEST/lib"
cd "$DEST"
F=https://archives.fedoraproject.org/pub/archive/fedora/linux/releases/40/Everything/x86_64/os/Packages
for U in \
  https://github.com/godunko/adawebpack/releases/download/24.0.0/adawebpack-24.0.0-git.fc40.x86_64.rpm \
  $F/l/llvm16-libs-16.0.6-7.fc40.x86_64.rpm \
  $F/c/clang16-libs-16.0.6-5.fc40.x86_64.rpm
do
  echo "fetch $U"
  curl -fL "$U" | rpm2cpio | cpio -idm --quiet
done
cp usr/lib64/llvm16/lib/libLLVM-16.so usr/lib64/llvm16/lib/libclang-cpp.so.16 lib/
if [ ! -e /usr/lib/x86_64-linux-gnu/libedit.so.0 ]; then
  ln -sf /usr/lib/x86_64-linux-gnu/libedit.so.2 lib/libedit.so.0
fi
if ! ldconfig -p | grep -q libgnat-14.so; then
  echo "llvm-gcc needs libgnat-14. Install GNAT 14, or the Alire gnat_native=14 runtime, then copy libgnat-14.so into $DEST/lib." >&2
  exit 1
fi
echo "AdaWebPack is at $DEST"
