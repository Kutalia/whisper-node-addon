import { platform, arch } from 'os';
import { join,resolve } from 'path';
import { promisify } from 'util';

export type WhisperOptions = {
    language?: string;
    model: string;
    use_gpu?: boolean;
    flash_attn?: boolean;
    no_prints?: boolean;
    comma_in_time?: boolean;
    translate?: boolean;
    no_timestamps?: boolean;
    audio_ctx?: number;
    max_len?: number;
    vad?: boolean;
    vad_model?: string;
    vad_threshold?: number;
    progress_callback?: (progress: any) => void;
} & ({
    fname_inp: string;
}| {
    pcmf32: Float32Array;
})

export type WhisperParams = WhisperOptions & {
    [key: string]: any;
}

const PLATFORM_MAPPING: { [key: string]: string } = {
    darwin: 'darwin',
    win32: 'win32',
    linux: 'linux'
};

function loadAddon() {
    const currentPlatform = PLATFORM_MAPPING[platform()];
    const currentArch = arch();

    if (!currentPlatform) {
        throw new Error(`Unsupported platform: ${platform()}`);
    }

    const addonPath = join(
        resolve(__dirname),
        '..',
        `${currentPlatform}-${currentArch}`,
        'whisper.node'
    );

    try {
        const { whisper } = require(addonPath);
        return promisify(whisper);
    } catch (error) {
        throw new Error(`Failed to load native addon: ${error}`);
    }
}

const whisperAsync = loadAddon();

export async function transcribe(options: WhisperOptions): Promise<{ transcription: string[][] | string[] }> {
    const defaultParams: WhisperParams = {
        language: 'en',
        use_gpu: true,
        flash_attn: false,
        no_prints: true,
        comma_in_time: false,
        translate: true,
        no_timestamps: false,
        detect_language: false,
        audio_ctx: 0,
        max_len: 0,
        ...options
    };

    if (!defaultParams.model) {
        throw new Error('Model path is required');
    }

    if (!defaultParams.fname_inp && !defaultParams.pcmf32) {
        throw new Error('Input file path is required');
    }

    return whisperAsync(defaultParams);
}

if (require.main === module) {
    const params = process.argv.slice(2).reduce((acc: any, arg) => {
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
