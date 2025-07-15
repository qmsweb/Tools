let audio;
let playlist = [];
let currentIndex = 0;
const jinglePath = 'sounds/jingle.mp3';

async function loadScheduleAndPlay() {
  const scheduleRes = await fetch('schedule.json');
  const scheduleData = await scheduleRes.json();
  playlist = scheduleData.radio_fayrouz;

  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();

  const now = new Date(timeData.datetime);
  const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let matched = false;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    const parts = item.start.split(':').map(Number);

    const startSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    const endSeconds = startSeconds + item.duration;

    if (nowSeconds >= startSeconds && nowSeconds < endSeconds) {
      const offset = nowSeconds - startSeconds;
      currentIndex = i;

      playJingle(() => playAudio(item.file, offset));
      matched = true;
      break;
    }
  }

  if (!matched) {
    // الوقت لا يطابق أي مقطع، ابدأ من البداية
    currentIndex = 0;
    playAudio(playlist[0].file, 0);
  }
}

function playAudio(src, offset = 0) {
  if (audio) {
    audio.pause();
  }

  audio = new Audio(src);
  audio.currentTime = offset;
  audio.play();

  audio.onended = () => {
    currentIndex++;
    if (currentIndex < playlist.length) {
      playJingle(() => playAudio(playlist[currentIndex].file, 0));
    }
  };
}

function playJingle(callback) {
  const jingle = new Audio(jinglePath);
  jingle.play();
  jingle.onended = () => {
    callback();
  };
}

document.getElementById('playIcon').onclick = () => {
  loadScheduleAndPlay();
};

document.getElementById('pauseIcon').onclick = () => {
  if (audio) audio.pause();
};
