let audio;
let playlist = [];
let currentIndex = 0;
let syncInterval;
const jinglePath = 'sounds/jingle.mp3';
const SYNC_INTERVAL = 10000; // 10 ثانية للتأكد من المزامنة

async function loadScheduleAndPlay() {
  const scheduleRes = await fetch('schedule.json');
  const scheduleData = await scheduleRes.json();
  playlist = scheduleData.radio_fayrouz;

  // بدء المزامنة الدورية
  startSyncInterval();
  
  // التشغيل الأولي
  syncAndPlay();
}

function startSyncInterval() {
  // أوقف أي مزامنة سابقة
  if (syncInterval) clearInterval(syncInterval);
  
  // ابدأ مزامنة دورية
  syncInterval = setInterval(syncAndPlay, SYNC_INTERVAL);
}

async function syncAndPlay() {
  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();
  const now = new Date(timeData.datetime);
  const nowInSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  // البحث عن المقطع الذي يجب أن يكون مشغلاً الآن
  let currentItem = null;
  let currentOffset = 0;
  
  for (let i = 0; i < playlist.length; i++) {
    const item = playlist[i];
    const parts = item.start.split(':').map(Number);
    const startInSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    const endInSeconds = startInSeconds + item.duration;

    if (nowInSeconds >= startInSeconds && nowInSeconds < endInSeconds) {
      currentItem = item;
      currentIndex = i;
      currentOffset = nowInSeconds - startInSeconds;
      break;
    }
  }

  // إذا لم يكن هناك مقطع مشغّل حالياً، ابحث عن التالي
  if (!currentItem) {
    for (let i = 0; i < playlist.length; i++) {
      const item = playlist[i];
      const parts = item.start.split(':').map(Number);
      const startInSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
      
      if (nowInSeconds < startInSeconds) {
        currentItem = item;
        currentIndex = i;
        const delay = (startInSeconds - nowInSeconds) * 1000;
        
        setTimeout(() => {
          playJingle(() => playAudio(currentItem.file, 0));
        }, delay);
        
        break;
      }
    }
  }

  // إذا وجدنا مقطعاً يجب تشغيله الآن
  if (currentItem) {
    // إذا كان المقطع الجديد مختلف عن الحالي أو لم يكن هناك تشغيل
    if (!audio || audio.src !== currentItem.file) {
      playAudio(currentItem.file, currentOffset);
    } else {
      // إذا كان نفس المقطع، تأكد من أنه في المكان الصحيح
      const expectedTime = currentOffset;
      const diff = Math.abs(audio.currentTime - expectedTime);
      
      // إذا كان الفارق كبيراً، صحح المسار
      if (diff > 5) {
        audio.currentTime = expectedTime;
      }
    }
  }
}

function playAudio(src, offset = 0) {
  if (audio) {
    audio.pause();
    audio.onended = null;
  }

  audio = new Audio(src);
  audio.currentTime = offset;
  audio.play();

  audio.onended = () => {
    // انتقل إلى المقطع التالي في القائمة
    currentIndex = (currentIndex + 1) % playlist.length;
    const nextItem = playlist[currentIndex];
    
    // احسب الوقت المتبقي حتى بداية المقطع التالي
    const nowInSeconds = getCurrentTimeInSeconds();
    const parts = nextItem.start.split(':').map(Number);
    const startInSeconds = (parts[0] * 3600) + (parts[1] * 60) + (parts[2] || 0);
    const delay = Math.max(0, (startInSeconds - nowInSeconds) * 1000);
    
    setTimeout(() => {
      playJingle(() => playAudio(nextItem.file, 0));
    }, delay);
  };
}

function playJingle(callback) {
  const jingle = new Audio(jinglePath);
  jingle.play();
  jingle.onended = callback;
}

async function getCurrentTimeInSeconds() {
  const timeRes = await fetch("https://worldtimeapi.org/api/timezone/Asia/Dubai");
  const timeData = await timeRes.json();
  const now = new Date(timeData.datetime);
  return now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
}

// التحكم بالأيقونات
document.getElementById('playIcon').onclick = () => {
  loadScheduleAndPlay();
};

document.getElementById('pauseIcon').onclick = () => {
  if (audio) audio.pause();
  if (syncInterval) clearInterval(syncInterval);
};
