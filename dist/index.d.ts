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
} | {
    pcmf32: Float32Array;
});
export type WhisperParams = WhisperOptions & {
    [key: string]: any;
};
export declare function transcribe(options: WhisperOptions): Promise<{
    transcription: string[][] | string[];
}>;
