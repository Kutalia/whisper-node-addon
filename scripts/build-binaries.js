const fs = require('fs')
const path = require('path')
const extract = require('extract-zip')
const wget = require('wget-improved-2')
const { execSync } = require('child_process')

// Downloads Whisper.cpp if not already present
const whisperPath = path.resolve(__dirname, '..', 'deps', 'whisper.cpp')
const whisperSubmoduleExists = fs.existsSync(whisperPath)

const distFolder = path.resolve(__dirname, '..', 'dist')

let openBlasUnzippedFolderPath = ''

if (!whisperSubmoduleExists) {
  try {
    execSync('git submodule update --init --recursive', { stdio: 'inherit' })
  } catch (err) {
    throw new Error('Error cloning Whisper submodule. You need to have Git installed')
  }
}

// A platform-archirecture combination for which the binaries are generated for
const buildingFor = process.argv[2]

async function prepareBuildConfig() {
  switch (buildingFor) {
    case 'win32-x64': {
      // Prebuilt OpenBLAS Windows binaries location
      const OPENBLAS_URL = 'https://github.com/OpenMathLib/OpenBLAS/releases/download/v0.3.30/OpenBLAS-0.3.30-x64-64.zip'
  
      function downloadAndSave(url, destination) {
        return new Promise((resolve) => {
          const download = wget.download(url, destination)
          download.on('end', () => {
            console.log(`${url} successfully downloaded`)
            resolve()
          })
        })
      }
  
      const openBlasDownloadFilename = OPENBLAS_URL.split('/').slice(-1)[0]
      const openBlasFolderName = openBlasDownloadFilename.split('.zip')[0]
  
      const openBlasZipPath = path.resolve(whisperPath, openBlasDownloadFilename)
      openBlasUnzippedFolderPath = path.resolve(whisperPath, openBlasFolderName)
  
      const openBlasExists = fs.existsSync(openBlasUnzippedFolderPath)
  
      if (!openBlasExists) {
        await downloadAndSave(OPENBLAS_URL, openBlasZipPath)
        fs.mkdirSync(openBlasUnzippedFolderPath)
        try {
          await extract(openBlasZipPath, { dir: openBlasUnzippedFolderPath })
          console.log(`${openBlasZipPath} successfully unzipped`)
          fs.unlinkSync(openBlasZipPath)
        } catch (err) {
          throw new Error(`Error unzipping ${openBlasZipPath}`)
        }
      }

      const openblasLibrariesPath = path.resolve(openBlasUnzippedFolderPath, 'lib', 'libopenblas.lib')
      const openBlasIncludeDirPath = path.resolve(openBlasUnzippedFolderPath, 'include')
  
      return `--CDGGML_VULKAN=1 --CDGGML_BLAS=1 --CDGGML_BLAS_VENDOR=OpenBLAS --CDBLAS_LIBRARIES=${openblasLibrariesPath} --CDBLAS_INCLUDE_DIRS=${openBlasIncludeDirPath}`
    }
    case 'linux-x64': {
      return '--CDGGML_VULKAN=1'
    }
    // No additional config for Mac since Vulkan is not available and it already builds with Metal and Blas backends
    default: {
      return ''
    }
  }
}

prepareBuildConfig().then((buildConfig) => {
  const buildCommands = [
    `cd ${whisperPath}`,
    'npx cmake-js clean', // Prepare for building by cleaning previous CMake artifacts
    `npx cmake-js configure ${buildConfig}`,
    'npx cmake-js compile -T addon.node -B Release --runtime=electron --runtime-version=37.1.0 --abi=125'
  ]

  const outputPath = path.resolve(distFolder, buildingFor)
  const whisperOutputPathFiles = path.resolve(whisperPath, 'build', buildingFor === 'win32-x64' ? 'bin/' : '', 'Release', '*')
  
  const postBuildCommands = [
    `shx rm -rf ${outputPath}`, // Delete previous artifacts
    `shx mkdir -p ${outputPath}`, // Recreate the folder
    `shx cp -r ${whisperOutputPathFiles} ${path.resolve(outputPath)}`, // Copy generated binaries to "dist"
    `shx mv ${path.resolve(outputPath, 'addon.node.node')} ${path.resolve(outputPath, 'whisper.node')}` // Rename addon
  ]
  
  if (buildingFor === 'win32-x64') {
    // OpenBLAS dynamic library needs to be copied into the output directory manually
    postBuildCommands.push(`shx cp ${path.resolve(openBlasUnzippedFolderPath, 'bin', 'libopenblas.dll')} ${outputPath}`)
  }
  
  const commands = [...buildCommands, ...postBuildCommands]
  
  execSync(commands.join(' && '), { stdio: 'inherit' })
})
