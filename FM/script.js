let audio;
let playlist = [];
let currentIndex = 0;
const jinglePath = 'sounds/jingle.mp3'; // مسار البصمة الصوتية

async function loadScheduleAndPlay() {
  // تحميل الجدول
  const scheduleRes = await fetch('schedule.json');
  const scheduleData = await scheduleRes.json();
  playlist = scheduleData.radio_fayrouz;

  // الوقت الحالي من API
  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();
  const now = new Date(timeData.datetime).getTime();

  let matched = false;

  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    const start = new Date(item.start).getTime();
    const end = start + item.duration * 1000;

    if (now >= start && now < end) {
      const offset = (now - start) / 1000;
      currentIndex = i;

      // شغّل البصمة ثم الأغنية الجارية
      playJingle(() => playAudio(item.file, offset));
      matched = true;
      break;
    }
  }

  if (!matched) {
    // الوقت خارج الجدول -> ابدأ من البداية
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

  // عند انتهاء الصوت، شغّل التالي
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
