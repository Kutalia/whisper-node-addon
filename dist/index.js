"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcribe = transcribe;
const os_1 = require("os");
const path_1 = require("path");
const util_1 = require("util");
// 平台映射
const PLATFORM_MAPPING = {
    darwin: 'darwin',
    win32: 'win32',
    linux: 'linux'
};
// 加载原生模块
function loadAddon() {
    const currentPlatform = PLATFORM_MAPPING[(0, os_1.platform)()];
    const currentArch = (0, os_1.arch)();
    if (!currentPlatform) {
        throw new Error(`Unsupported platform: ${(0, os_1.platform)()}`);
    }
    const addonPath = (0, path_1.join)((0, path_1.resolve)(__dirname), '..', 'platform', `${currentPlatform}-${currentArch}`, 'whisper.node');
    try {
        const { whisper } = require(addonPath);
        return (0, util_1.promisify)(whisper);
    }
    catch (error) {
        throw new Error(`Failed to load native addon: ${error}`);
    }
}
const whisperAsync = loadAddon();
// 主方法
function transcribe(options) {
    return __awaiter(this, void 0, void 0, function* () {
        // 合并默认参数
        const defaultParams = Object.assign({ language: 'en', use_gpu: true, flash_attn: false, no_prints: true, comma_in_time: false, translate: true, no_timestamps: false, detect_language: false, audio_ctx: 0, max_len: 0 }, options);
        // 参数验证
        if (!defaultParams.model) {
            throw new Error('Model path is required');
        }
        if (!defaultParams.fname_inp && !defaultParams.pcmf32) {
            throw new Error('Input file path is required');
        }
        return whisperAsync(defaultParams);
    });
}
// 命令行支持
if (require.main === module) {
    const params = process.argv.slice(2).reduce((acc, arg) => {
        if (arg.startsWith('--')) {
            const [key, value] = arg.slice(2).split('=');
            acc[key] = value ? (isNaN(Number(value)) ? value : Number(value)) : true;
        }
        return acc;
    }, {});
    transcribe(params)
        .then(console.log)
        .catch(err => {
        console.error('Transcription failed:', err);
        process.exit(1);
    });
}
