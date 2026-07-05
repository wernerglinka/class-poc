/**
 * Custom Audio Player
 * Provides consistent cross-browser audio controls using functional approach
 */

/**
 * Creates an audio player state object
 * @param {HTMLElement} container - The audio player container
 * @returns {Object} Audio player state
 */
const createAudioPlayerState = (container) => {
  return {
    container,
    audio: container.querySelector('audio'),
    playPauseBtn: container.querySelector('.play-pause-btn'),
    playIcon: container.querySelector('.play-icon'),
    pauseIcon: container.querySelector('.pause-icon'),
    progressBar: container.querySelector('.progress-bar'),
    progressFill: container.querySelector('.progress-fill'),
    progressHandle: container.querySelector('.progress-handle'),
    progressInput: container.querySelector('.progress-input'),
    currentTimeSpan: container.querySelector('.current-time'),
    durationSpan: container.querySelector('.duration'),
    volumeBtn: container.querySelector('.volume-btn'),
    volumeInput: container.querySelector('.volume-input'),
    volumeHighIcon: container.querySelector('.volume-high'),
    volumeLowIcon: container.querySelector('.volume-low'),
    volumeMuteIcon: container.querySelector('.volume-mute'),
    isDragging: false,
    wasPlayingBeforeDrag: false
  };
};

/**
 * Initialize audio player with event listeners
 * @param {Object} state - Audio player state
 * @returns {Object} Updated state
 */
const initAudioPlayer = (state) => {
  if (!state.audio) {
    console.error('Audio element not found in container:', state.container);
    return state;
  }

  // Event listeners
  state.playPauseBtn.addEventListener('click', () => togglePlayPause(state));
  state.audio.addEventListener('loadedmetadata', () => updateDuration(state));
  state.audio.addEventListener('timeupdate', () => updateProgress(state));
  state.audio.addEventListener('ended', () => onAudioEnded(state));

  // Progress bar interactions
  state.progressInput.addEventListener('input', (e) => seekTo(state, e.target.value));
  state.progressInput.addEventListener('mousedown', () => startDragging(state));
  state.progressInput.addEventListener('mouseup', () => stopDragging(state));
  state.progressBar.addEventListener('click', (e) => seekToClick(state, e));

  // Volume controls
  state.volumeBtn.addEventListener('click', () => toggleMute(state));
  state.volumeInput.addEventListener('input', (e) => setVolume(state, e.target.value));

  // Keyboard accessibility
  state.container.addEventListener('keydown', (e) => handleKeyboard(state, e));

  // Initialize volume
  setVolume(state, 100);

  // Load audio metadata
  if (state.audio.readyState >= 1) {
    updateDuration(state);
  }

  return state;
};

/**
 * Toggle play/pause state
 * @param {Object} state - Audio player state
 */
const togglePlayPause = (state) => {
  if (state.audio.paused) {
    play(state);
  } else {
    pause(state);
  }
};

/**
 * Play audio
 * @param {Object} state - Audio player state
 */
const play = (state) => {
  const playPromise = state.audio.play();

  if (playPromise !== undefined) {
    playPromise
      .then(() => {
        updatePlayPauseButton(state, true);
      })
      .catch((error) => {
        console.error('Audio play failed:', error);
        updatePlayPauseButton(state, !state.audio.paused);
      });
  } else {
    updatePlayPauseButton(state, !state.audio.paused);
  }
};

/**
 * Pause audio
 * @param {Object} state - Audio player state
 */
const pause = (state) => {
  state.audio.pause();
  updatePlayPauseButton(state, false);
};

/**
 * Update play/pause button display
 * @param {Object} state - Audio player state
 * @param {boolean} isPlaying - Whether audio is playing
 */
const updatePlayPauseButton = (state, isPlaying) => {
  if (isPlaying) {
    state.playIcon.style.display = 'none';
    state.pauseIcon.style.display = 'inline';
    state.playPauseBtn.setAttribute('aria-label', 'Pause');
  } else {
    state.playIcon.style.display = 'inline';
    state.pauseIcon.style.display = 'none';
    state.playPauseBtn.setAttribute('aria-label', 'Play');
  }
};

/**
 * Update progress display
 * @param {Object} state - Audio player state
 */
const updateProgress = (state) => {
  if (state.isDragging) {
    return;
  }

  const currentTime = state.audio.currentTime;
  const duration = state.audio.duration;

  if (duration) {
    const progressPercent = (currentTime / duration) * 100;
    updateProgressDisplay(state, progressPercent);
    state.progressInput.value = progressPercent;
  }

  state.currentTimeSpan.textContent = formatTime(currentTime);
};

/**
 * Update progress bar visual display
 * @param {Object} state - Audio player state
 * @param {number} percent - Progress percentage
 */
const updateProgressDisplay = (state, percent) => {
  state.progressFill.style.width = `${percent}%`;
  state.progressHandle.style.left = `${percent}%`;
};

/**
 * Seek to specific position
 * @param {Object} state - Audio player state
 * @param {number} percent - Position percentage
 */
const seekTo = (state, percent) => {
  const duration = state.audio.duration;
  if (duration) {
    const newTime = (percent / 100) * duration;
    state.audio.currentTime = newTime;
    updateProgressDisplay(state, percent);
  }
};

/**
 * Seek to clicked position on progress bar
 * @param {Object} state - Audio player state
 * @param {Event} e - Click event
 */
const seekToClick = (state, e) => {
  const rect = state.progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percent = (clickX / rect.width) * 100;
  seekTo(state, Math.max(0, Math.min(100, percent)));
};

/**
 * Start dragging progress handle
 * @param {Object} state - Audio player state
 * @returns {Object} Updated state
 */
const startDragging = (state) => {
  const newState = { ...state, isDragging: true };
  newState.wasPlayingBeforeDrag = !state.audio.paused;
  if (newState.wasPlayingBeforeDrag) {
    pause(newState);
  }
  return newState;
};

/**
 * Stop dragging progress handle
 * @param {Object} state - Audio player state
 * @returns {Object} Updated state
 */
const stopDragging = (state) => {
  const newState = { ...state, isDragging: false };
  if (state.wasPlayingBeforeDrag) {
    play(newState);
  }
  return newState;
};

/**
 * Update duration display
 * @param {Object} state - Audio player state
 */
const updateDuration = (state) => {
  const duration = state.audio.duration;
  if (duration && !Number.isNaN(duration)) {
    state.durationSpan.textContent = formatTime(duration);
  }
};

/**
 * Handle audio ended event
 * @param {Object} state - Audio player state
 */
const onAudioEnded = (state) => {
  updatePlayPauseButton(state, false);
  state.audio.currentTime = 0;
  updateProgress(state);
};

/**
 * Toggle mute state
 * @param {Object} state - Audio player state
 */
const toggleMute = (state) => {
  if (state.audio.muted) {
    state.audio.muted = false;
    const volumePercent = state.audio.volume * 100;
    updateVolumeIcon(state, state.audio.volume);
    state.volumeInput.value = volumePercent;
    updateVolumeSliderFill(state, volumePercent);
  } else {
    state.audio.muted = true;
    updateVolumeIcon(state, 0);
    state.volumeInput.value = 0;
    updateVolumeSliderFill(state, 0);
  }
};

/**
 * Set volume level
 * @param {Object} state - Audio player state
 * @param {number} value - Volume value (0-100)
 */
const setVolume = (state, value) => {
  const volume = value / 100;
  state.audio.volume = volume;
  state.audio.muted = volume === 0;
  updateVolumeIcon(state, volume);
  updateVolumeSliderFill(state, value);
};

/**
 * Update volume slider fill gradient
 * @param {Object} state - Audio player state
 * @param {number} percent - Volume percentage (0-100)
 */
const updateVolumeSliderFill = (state, percent) => {
  // For WebKit browsers, apply gradient to show filled portion
  const trackGradient = `linear-gradient(to right, black 0%, black ${percent}%, white ${percent}%, white 100%)`;
  state.volumeInput.style.background = trackGradient;
};

/**
 * Update volume icon display
 * @param {Object} state - Audio player state
 * @param {number} volume - Volume level (0-1)
 */
const updateVolumeIcon = (state, volume) => {
  // Hide all volume icons first
  state.volumeHighIcon.style.display = 'none';
  state.volumeLowIcon.style.display = 'none';
  state.volumeMuteIcon.style.display = 'none';

  // Show the appropriate icon based on volume level
  if (volume === 0 || state.audio.muted) {
    state.volumeMuteIcon.style.display = 'inline';
    state.volumeBtn.setAttribute('aria-label', 'Unmute');
  } else if (volume < 0.5) {
    state.volumeLowIcon.style.display = 'inline';
    state.volumeBtn.setAttribute('aria-label', 'Mute');
  } else {
    state.volumeHighIcon.style.display = 'inline';
    state.volumeBtn.setAttribute('aria-label', 'Mute');
  }
};

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} Formatted time string
 */
const formatTime = (seconds) => {
  if (!seconds || Number.isNaN(seconds)) {
    return '0:00';
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Handle keyboard events
 * @param {Object} state - Audio player state
 * @param {Event} e - Keyboard event
 */
const handleKeyboard = (state, e) => {
  if (e.target !== state.container && !state.container.contains(e.target)) {
    return;
  }

  switch (e.key) {
    case ' ':
    case 'Enter':
      e.preventDefault();
      togglePlayPause(state);
      break;
    case 'ArrowLeft':
      e.preventDefault();
      state.audio.currentTime = Math.max(0, state.audio.currentTime - 10);
      break;
    case 'ArrowRight':
      e.preventDefault();
      state.audio.currentTime = Math.min(state.audio.duration, state.audio.currentTime + 10);
      break;
    case 'm':
    case 'M':
      e.preventDefault();
      toggleMute(state);
      break;
  }
};

/**
 * Initialize a single audio player
 * @param {HTMLElement} container - Audio player container
 */
const initSingleAudioPlayer = (container) => {
  // Skip if already initialized
  if (container.dataset.initialized) {
    return;
  }

  const state = createAudioPlayerState(container);
  initAudioPlayer(state);

  container.dataset.initialized = 'true';
};

/**
 * Initialize all audio players on the page
 */
function initAudioPlayers() {
  const audioPlayers = document.querySelectorAll('[data-audio-player]');
  audioPlayers.forEach(initSingleAudioPlayer);
}

// Register with page transitions for SWUP support
if (window.PageTransitions) {
  window.PageTransitions.registerComponent('audio', initAudioPlayers);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAudioPlayers);
} else {
  initAudioPlayers();
}
