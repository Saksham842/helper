declare module 'mammoth' {
  export interface ExtractionResult {
    value: string;
    messages: Array<{
      type: string;
      message: string;
    }>;
  }

  export interface Options {
    buffer?: Buffer;
    path?: string;
  }

  export function extractRawText(options: Options): Promise<ExtractionResult>;
  export function convertToHtml(options: Options): Promise<ExtractionResult>;
}
