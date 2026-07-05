/**
 * Cloudinary Video Provider
 */

import loadScript from '../helpers/load-script.js';
import loadStyles from '../helpers/load-styles.js';

/**
 * Cloudinary Modal Player
 */
export const createCloudinaryModal = async (videoId, targetId, cloudName) => {
  await Promise.all([
    loadStyles('https://unpkg.com/cloudinary-video-player@latest/dist/cld-video-player.min.css'),
    loadScript('https://unpkg.com/cloudinary-video-player@latest/dist/cld-video-player.min.js')
  ]);

  const videoElement = document.createElement('video');
  videoElement.id = `${targetId}-video`;
  videoElement.controls = true;
  videoElement.autoplay = true;
  videoElement.className = 'cld-video-player';
  videoElement.dataset.cldPublicId = videoId;

  document.getElementById(targetId).appendChild(videoElement);

  const player = cloudinary.videoPlayer(videoElement.id, {
    cloudName,
    playedEventPercents: [100]
  });

  player.on('percentsplayed', (data) => {
    if (data.percent === 100) {
      document.dispatchEvent(new CustomEvent('video-ended'));
    }
  });

  return player;
};

/**
 * Cloudinary inSitu Player
 */
export const createCloudinaryinSitu = async (element, videoId, cloudName) => {
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

      await Promise.all([
        loadStyles('https://unpkg.com/cloudinary-video-player@latest/dist/cld-video-player.min.css'),
        loadScript('https://unpkg.com/cloudinary-video-player@latest/dist/cld-video-player.min.js')
      ]);

      const videoElement = document.createElement('video');
      videoElement.id = `${element.id}-video`;
      videoElement.controls = true;
      videoElement.className = 'cld-video-player';
      videoElement.dataset.cldPublicId = videoId;

      element.appendChild(videoElement);

      player = cloudinary.videoPlayer(videoElement.id, {
        cloudName,
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
