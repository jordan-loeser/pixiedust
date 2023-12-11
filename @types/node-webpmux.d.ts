declare module "node-webpmux" {
  import { Buffer } from "buffer";
  import { Readable } from "stream";

  namespace WebP {
    export const TYPE_LOSSY: number = 0;
    export const TYPE_LOSSLESS: number = 1;
    export const TYPE_EXTENDED: number = 2;

    export enum encodeResults {
      // These are errors from binding.cpp
      LIB_NOT_READY = -1, // <interface>.initEnc() was not called. This happens internally during <interface>.encodeImage() and thus should never happen.
      LIB_INVALID_CONFIG = -2, // invalid options passed in via set[Image/Frame]Data. This should never happen.
      SUCCESS = 0,
      // These errors are from native code and can be found in upstream libwebp/src/encode.h, WebPEncodingError enum
      VP8_ENC_ERROR_OUT_OF_MEMORY = 1, // memory error allocating objects
      VP8_ENC_ERROR_BITSTREAM_OUT_OF_MEMORY = 2, // memory error while flushing bits
      VP8_ENC_ERROR_NULL_PARAMETER = 3, // a pointer parameter is NULL
      VP8_ENC_ERROR_INVALID_CONFIGURATION = 4, // configuration is invalid
      VP8_ENC_ERROR_BAD_DIMENSION = 5, // picture has invalid width/height
      VP8_ENC_ERROR_PARTITION0_OVERFLOW = 6, // partition is bigger than 512k
      VP8_ENC_ERROR_PARTITION_OVERFLOW = 7, // partition is bigger than 16M
      VP8_ENC_ERROR_BAD_WRITE = 8, // error while flushing bytes
      VP8_ENC_ERROR_FILE_TOO_BIG = 9, // file is bigger than 4G
      VP8_ENC_ERROR_USER_ABORT = 10, // abort request by user
      VP8_ENC_ERROR_LAST = 11, // list terminator. always last.
    }

    interface Frame {
      x?: number;
      y?: number;
      delay?: number;
      blend?: boolean;
      dispose?: boolean;
    }

    interface SharedSaveOptions {
      exif?: Buffer | true;
      iccp?: Buffe | true;
      xmp?: Buffer | true;
    }

    interface AnimationSaveOptions {
      width?: number;
      height?: number;
      bgColor?: [r: number, g: number, b: number, a: number];
      loops?: number;
      x?: number;
      y?: number;
      delay?: number;
      blend?: boolean;
      dispose?: boolean;
      frames: Frame[];
    }

    type SaveOptions =
      | SharedSaveOptions
      | (SharedSaveOptions & AnimationSaveOptions);

    interface DemuxOptions {
      path?: string;
      buffers?: boolean;
      prefix?: string;
      frame?: number;
      start?: number;
      end?: number;
    }

    type GenerateFrameOptions =
      | ({
          path: string;
        } & Frame)
      | ({
          buffer: Buffer;
        } & Frame)
      | ({
          img: Image;
        } & Frame);

    interface AdvancedEncodingOptions {
      imageHint?: number;
      targetSize?: number;
      targetPSNR?: number;
      segments?: number;
      snsStrength?: number;
      filterStrength?: number;
      filterSharpness?: number;
      filterType?: number;
      autoFilter?: number;
      alphaCompression?: number;
      alphaFiltering?: number;
      alphaQuality?: number;
      pass?: number;
      showCompressed?: number;
      preprocessing?: number;
      partitions?: number;
      partitionLimit?: number;
      emulateJpegSize?: number;
      threadLevel?: number;
      lowMemory?: number;
      nearLossless?: number;
      useDeltaPalette?: number;
      useSharpYUV?: number;
      qMin?: number;
      qMax?: number;
    }

    interface SetImageDataOptions {
      width?: number;
      height?: number;
      preset?: number;
      quality?: number;
      exact?: boolean;
      lossless?: 0 | 1 | 2 | 3 | 4 | 5;
      method?: number;
      advanced?: AdvancedEncodingOptions;
    }

    class Image {
      width: number;
      height: number;
      type: ImageType;
      hasAnim: boolean;
      hasAlpha: boolean;
      frames?: Frame[];
      frameCount: number;
      anim: AnimationType;
      iccp?: Buffer;
      exif?: Buffer;
      xpm?: Buffer;

      // Static Functions

      static initLib(): Promise<void>;

      static from(webp: any): Promise<Image>;

      static save(path: string, options: SaveOptions): Promise<void>;
      static save(path: null, options: SaveOptions): Promise<Buffer>;

      static getEmptyImage(ext?: boolean): Promise<Image>;

      static generateFrame(options: GenerateFrameOptions): Promise<Frame>;

      // Member Functions

      initLib(): Promise<void>;

      load(src: string | Buffer): Promise<Image>;

      convertToAnim(): void;

      demux(options: DemuxOptions): Promise<void>;

      replaceFrame(frameIndex: number, source: string | Buffer): Promise<void>;

      save(path: string, options: SaveOptions): Promise<void>;
      save(path: null, options: SaveOptions): Promise<Buffer>;

      getImageData(): Promise<Buffer>;

      setImageData(buffer: Buffer, options: SetImageDataOptions): Promise<void>;

      getFrameData(): Promise<Buffer>;

      setFrameData(
        frameIndex: number,
        buffer: Buffer,
        options: SetImageDataOptions
      ): Promise<void>;
    }
  }

  export = WebP;
}
