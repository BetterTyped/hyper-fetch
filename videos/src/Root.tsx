import React from "react";
import { Composition } from "remotion";

import { LaunchVideo, videoLength } from "./brand/LaunchVideo";
import { GALLERY_HEIGHT, GALLERY_WIDTH, PatternGallery, PatternReel, REEL_LENGTH } from "./PatternGallery";
import { FPS, HEIGHT, WIDTH } from "./brand/tokens";
import { videos } from "./videos";

/* Remotion sends props through JSON, so the scenes (React nodes) are looked up by id instead of passed in */
const VideoById: React.FC<{ id: string }> = ({ id }) => {
  const video = videos.find((v) => v.id === id);
  if (!video) throw new Error(`Unknown video ${id}`);
  return <LaunchVideo video={video} />;
};

export const Root: React.FC = () => (
  <>
    {videos.map((video) => (
      <Composition
        key={video.id}
        id={video.id}
        component={VideoById}
        defaultProps={{ id: video.id }}
        durationInFrames={videoLength(video)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    ))}
    {/* Not a launch video: every backdrop pattern side by side, for choosing */}
    <Composition id="PatternGallery" component={PatternGallery} defaultProps={{ strength: 0.45 }} durationInFrames={FPS * 8} fps={FPS} width={GALLERY_WIDTH} height={GALLERY_HEIGHT} />
    <Composition id="PatternReel" component={PatternReel} defaultProps={{ strength: 0.45 }} durationInFrames={FPS * REEL_LENGTH} fps={FPS} width={WIDTH} height={HEIGHT} />
  </>
);
