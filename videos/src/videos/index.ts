import type { VideoDefinition } from "../brand/LaunchVideo";
import { backendsVideo } from "./backends";
import { coreReactVideo } from "./core-react";
import { dbVideo } from "./db";
import { firebaseVideo } from "./firebase";
import { graphqlVideo } from "./graphql";
import { hyperFetch10Video } from "./overview";
import { socketsVideo } from "./sockets";
import { toolingVideo } from "./tooling";

/* One launch video per HyperFetch 10 blog post, in the order of the posts */
export const videos: VideoDefinition[] = [
  hyperFetch10Video,
  dbVideo,
  coreReactVideo,
  backendsVideo,
  socketsVideo,
  graphqlVideo,
  firebaseVideo,
  toolingVideo,
];
