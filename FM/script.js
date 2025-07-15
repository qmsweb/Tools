let audio;
let playlist = [];
let currentIndex = 0;
const jinglePath = 'sounds/jingle.mp3';

async function loadScheduleAndPlay() {
  const scheduleRes = await fetch('schedule.json');
  const scheduleData = await scheduleRes.json();
  playlist = scheduleData.radio_fayrouz;

  // جلب الوقت الحالي من دبي (GMT+4)
  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();

  const now = new Date(timeData.datetime);
  const nowInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  let found = false;

  // البحث عن المقطع الحالي الذي يجب أن يكون مشغلاً
  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    const parts = item.start.split(':').map(Number);
    const startInSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    const endInSeconds = startInSeconds + item.duration;

    // التحقق هل الوقت الحالي داخل هذا المقطع؟
    if (nowInSeconds >= startInSeconds && nowInSeconds < endInSeconds) {
      const offset = nowInSeconds - startInSeconds;
      currentIndex = i;
      
      // تشغيل الأغنية مباشرة من المكان الصحيح
      playAudio(item.file, offset);
      found = true;
      break;
    }
  }

  // إذا لم يوجد مقطع مشغّل حالياً، ابحث عن التالي في الجدول
  if (!found) {
    for (let i = 0; i < playlist.length; i++) {
      const item = playlist[i];
      const parts = item.start.split(':').map(Number);
      const startInSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
      
      if (nowInSeconds < startInSeconds) {
        currentIndex = i;
        
        // احسب المدة المتبقية حتى بداية المقطع التالي
        const timeUntilNext = startInSeconds - nowInSeconds;
        
        // انتظر حتى يحين وقت المقطع التالي ثم شغله
        setTimeout(() => {
          playJingle(() => playAudio(item.file, 0));
        }, timeUntilNext * 1000);
        
        found = true;
        break;
      }
    }
  }

  // إذا لم يوجد أي مقطع قادم (مثلاً في نهاية اليوم)
  if (!found) {
    currentIndex = 0;
    playAudio(playlist[0].file, 0);
  }
}

function playAudio(src, offset = 0) {
  if (audio) audio.pause();

  audio = new Audio(src);
  audio.currentTime = offset;
  audio.play();

  // عند انتهاء الصوت → انتقل إلى التالي
  audio.onended = () => {
    currentIndex++;
    if (currentIndex < playlist.length) {
      // شغل البصمة ثم المقطع التالي
      playJingle(() => playAudio(playlist[currentIndex].file, 0));
    } else {
      // إذا انتهت القائمة، ابدأ من جديد
      currentIndex = 0;
      playJingle(() => playAudio(playlist[currentIndex].file, 0));
    }
  };
}

function playJingle(callback) {
  const jingle = new Audio(jinglePath);
  jingle.play();
  jingle.onended = callback;
}

// التحكم بالأيقونات
document.getElementById('playIcon').onclick = () => {
  loadScheduleAndPlay();
};

document.getElementById('pauseIcon').onclick = () => {
  if (audio) audio.pause();
};
