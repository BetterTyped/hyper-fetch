import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(95);
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setConcurrency(null);
/* Light leaks and other effects draw with WebGL */
Config.setChromiumOpenGlRenderer("angle");
