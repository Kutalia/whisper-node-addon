### This is a fork of [whisper-node-addon](https://github.com/starNGC2237/whisper-node-addon) supplemented with Vulkan and OpenBLAS backends for Windows and Vulkan backend for Linux

This version is specifically optimized for real-time usage (supports sending PCM data, not just audio file path). In doing so it relies on [my fork of whisper.cpp](https://github.com/Kutalia/whisper.cpp/tree/feature/realtime-node-addon).

You can generate addon files locally by building the project (see `scripts` in `package.json`).

To build for other architectures, you can use [Act](https://github.com/nektos/act) in the project root with `--artifact-server-path` option. It is a docker based local Github Actions runner.

Or straight up install with `npm install @kutalia/whisper-node-addon` and start using it.

## Requirements for building
- [CMake](http://www.cmake.org/download/)
- A proper C/C++ compiler toolchain of the given platform
  - **Windows**:
    - [Visual C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/). If you installed nodejs with the installer, you can install these when prompted.
    - An alternate way is to install the [Chocolatey package manager](https://chocolatey.org/install), and run `choco install visualstudio2017-workload-vctools` in an Administrator Powershell
    - If you have multiple versions installed, you can select a specific version with `npm config set msvs_version 2017` (Note: this will also affect `node-gyp`)
  - **Unix/Posix**:
    - Clang or GCC
    - Ninja or Make (Ninja will be picked if both present)
- `pkg-config` substitute for **Windows** when building with **OpenBLAS**. Can be installed with `choco install pkgconfiglite`
- [Vulkan SDK](https://vulkan.lunarg.com/) when building with **Vulkan** on **Windows** or **Linux**


## 📜 TODO
- [ ] Add CUDA backend binaries and installation scripts

# whisper-node-addon 🌐🔉

[![npm version](https://img.shields.io/npm/v/@kutalia/whisper-node-addon)](https://www.npmjs.com/package/@kutalia/whisper-node-addon)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Prebuilt whisper.cpp bindings for Node.js & Electron across all platforms.**  
No native compilation headaches. Just `import` and go!

## ✨ Features
- ✅ **Pre-built `.node` binaries** for Windows (x64), Linux (x64/arm64), macOS (x64/arm64)
- ✅ **Automatic runtime detection** - Load correct binary for the current OS/arch
- ✅ **Zero-config for Electron** - Seamless integration with Electron apps
- ✅ **Supports many whisper.cpp features** - VAD (voice activity detection), sending audio chunks in form of PCM32 data, GPU acceleration, multi-threaded CPU inference

## 📦 Installation
```bash
npm install @kutalia/whisper-node-addon
```

## 🚀 Usage
GGML models need to be already downloaded. You can find some of them at https://huggingface.co/ggerganov/whisper.cpp/tree/main

Or build yourself as per [official whisper.cpp docs](https://github.com/ggml-org/whisper.cpp/tree/master/models)
```javascript
import whisper from '@kutalia/whisper-node-addon'

// Transcribe audio
const result = await whisper.transcribe({
  fname_inp: 'audio.wav',
  model: 'ggml-base.en.bin',
  language: 'en',
  use_gpu: true // Auto-detects Vulkan/Metal
});

console.log(result); 
```
 You can also target the script with CLI:
 `node dist/js/index.js --fname_inp=audio.wav --model=ggml-base.en.bin --language=en --use_gpu=true`
 