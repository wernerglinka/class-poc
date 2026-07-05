/**
 * YouTube Video Provider
 */

import loadYouTubeAPI from '../helpers/load-youtube-api.js';

/**
 * YouTube Modal Player
 */
export const createYouTubeModal = async (videoId, targetId, options) => {
  await loadYouTubeAPI();

  const player = new YT.Player(targetId, {
    videoId,
    playerVars: {
      autoplay: 1,
      controls: 1,
      enablejsapi: 1,
      start: options.startTime,
      end: options.endTime
    },
    events: {
      onReady: (event) => {
        event.target.playVideo();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.ENDED) {
          // Emit custom event for main component
          document.dispatchEvent(new CustomEvent('video-ended'));
        }
      }
    }
  });

  return player;
};

/**
 * YouTube inSitu Player
 */
export const createYouTubeinSitu = async (element, videoId, options) => {
  const container = element.closest('.video');
  const trigger = container?.querySelector('.video-trigger');
  const close = container?.querySelector('.close');

  if (!trigger) {
    return null;
  }

  let player = null;

  trigger.onclick = async () => {
    if (!player) {
      // Notify main component to stop other players
      document.dispatchEvent(new CustomEvent('video-starting'));

      await loadYouTubeAPI();

      player = new YT.Player(element.id, {
        videoId,
        playerVars: {
          autoplay: 1,
          controls: 1,
          start: options.startTime,
          end: options.endTime
        },
        events: {
          onReady: () => {
            document.dispatchEvent(new CustomEvent('video-ready', { detail: player }));
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              container.classList.remove('video-playing');
            }
          }
        }
      });
    }

    container.classList.add('video-playing');
    if (player.playVideo) {
      player.playVideo();
    }
  };

  if (close) {
    close.onclick = () => {
      container.classList.remove('video-playing');
      if (player?.pauseVideo) {
        player.pauseVideo();
      }
    };
  }

  // Listen for modal opening to stop this video
  const stopOnModalOpen = () => {
    if (container.classList.contains('video-playing')) {
      container.classList.remove('video-playing');
      if (player?.pauseVideo) {
        player.pauseVideo();
      }
    }
  };

  document.addEventListener('modal-opening', stopOnModalOpen);

  return {
    element,
    stop: () => player?.pauseVideo?.(),
    cleanup: () => document.removeEventListener('modal-opening', stopOnModalOpen)
  };
};
