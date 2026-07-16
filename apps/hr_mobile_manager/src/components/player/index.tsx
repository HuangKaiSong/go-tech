import { createPlayer, videoFeatures } from '@videojs/react';
import { Video, VideoSkin } from '@videojs/react/video';
// oxlint-disable-next-line import/no-unassigned-import
import '@videojs/react/video/skin.css';

const Player = createPlayer({ features: videoFeatures });

interface PlayerProps {
  /** 低清模糊佔位圖，封面加載時的 blur-up 過渡效果（可選） */
  placeholder?: string;
  /** 封面圖，播放前顯示，開始播放後自動隱藏 */
  poster?: string;
  src: string;
}

const VideoPlayer = (props: PlayerProps) => {
  return (
    <Player.Provider>
      <VideoSkin poster={props.poster} placeholder={props.placeholder}>
        <Video src={props.src} muted />
      </VideoSkin>
    </Player.Provider>
  );
};

export default VideoPlayer;
