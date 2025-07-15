let audio;

async function loadScheduleAndPlay() {
  const scheduleRes = await fetch('schedule.json');
  const scheduleData = await scheduleRes.json();
  const playlist = scheduleData.radio_fayrouz;

  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();
  const now = new Date(timeData.datetime).getTime();

  for (let item of playlist) {
    const start = new Date(item.start).getTime();
    const end = start + item.duration * 1000;

    if (now >= start && now < end) {
      const offset = (now - start) / 1000;

      audio = new Audio(item.file);
      audio.currentTime = offset;
      audio.play();
      break;
    }
  }
}

document.getElementById('playIcon').onclick = () => {
  loadScheduleAndPlay();
};

document.getElementById('pauseIcon').onclick = () => {
  if (audio) audio.pause();
};
