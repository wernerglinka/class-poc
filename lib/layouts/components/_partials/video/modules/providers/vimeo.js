/**
 * Vimeo Video Provider
 */

import loadScript from '../helpers/load-script.js';

/**
 * Vimeo Modal Player
 */
export const createVimeoModal = async (videoId, targetId) => {
  await loadScript('https://player.vimeo.com/api/player.js');

  const player = new Vimeo.Player(targetId, {
    id: videoId,
    autoplay: true
  });

  player.on('ended', () => {
    document.dispatchEvent(new CustomEvent('video-ended'));
  });

  return player;
};

/**
 * Vimeo inSitu Player
 */
export const createVimeoinSitu = async (element, videoId) => {
  const container = element.closest('.video');
  const trigger = container?.querySelector('.video-trigger');
  const close = container?.querySelector('.close');

  if (!trigger) {
    return null;
  }

  let player = null;

  trigger.onclick = async () => {
    if (!player) {
      document.dispatchEvent(new CustomEvent('video-starting'));

      await loadScript('https://player.vimeo.com/api/player.js');

      player = new Vimeo.Player(element.id, {
        id: videoId,
        autoplay: true
      });

      document.dispatchEvent(new CustomEvent('video-ready', { detail: player }));

      player.on('ended', () => {
        container.classList.remove('video-playing');
      });
    }

    container.classList.add('video-playing');
    if (player.play) {
      player.play();
    }
  };

  if (close) {
    close.onclick = () => {
      container.classList.remove('video-playing');
      if (player?.pause) {
        player.pause();
      }
    };
  }

  // Listen for modal opening to stop this video
  const stopOnModalOpen = () => {
    if (container.classList.contains('video-playing')) {
      container.classList.remove('video-playing');
      if (player?.pause) {
        player.pause();
      }
    }
  };

  document.addEventListener('modal-opening', stopOnModalOpen);

  return {
    element,
    stop: () => player?.pause?.(),
    cleanup: () => document.removeEventListener('modal-opening', stopOnModalOpen)
  };
};
