// Windows 11 Launcher for Android Client Logic
let INSTALLED_APPS = [];
let ALL_APPS_VIEW = false;

const MOCK_FALLBACK_APPS = [
  { name: 'Edge Browser', packageName: 'com.android.chrome', icon: '🌐' },
  { name: 'Termux', packageName: 'com.termux', icon: '⚡' },
  { name: 'Settings', packageName: 'com.android.settings', icon: '⚙️' },
  { name: 'Camera', packageName: 'com.android.camera', icon: '📷' },
  { name: 'File Explorer', packageName: 'com.google.android.documentsui', icon: '📁' },
  { name: 'WhatsApp', packageName: 'com.whatsapp', icon: '💬' },
  { name: 'YouTube', packageName: 'com.google.android.youtube', icon: '▶️' },
  { name: 'GitHub', packageName: 'com.github.android', icon: '🐙' }
];

document.addEventListener('DOMContentLoaded', () => {
  updateTrayClock();
  setInterval(updateTrayClock, 1000);

  loadDeviceInfo();
  loadRealInstalledApps();

  window.onHomePressed = () => {
    closeStartMenu();
    closeWidgetsBoard();
    closeAppModal();
    triggerHaptic();
  };

  const startInput = document.getElementById('start-search-input');
  const clearBtn = document.getElementById('start-search-clear');

  if (startInput) {
    startInput.addEventListener('input', () => {
      const q = startInput.value.toLowerCase().trim();
      clearBtn.style.display = q ? 'block' : 'none';
      filterStartApps(q);
    });

    startInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        triggerHaptic();
        const q = startInput.value.trim();
        if (q) {
          const match = INSTALLED_APPS.find(a => a.name.toLowerCase() === q.toLowerCase());
          if (match) {
            triggerAppLaunch(match);
          } else {
            searchWeb(q);
          }
          clearStartSearch();
          closeStartMenu();
        }
      }
    });
  }
});

function triggerHaptic() {
  if (window.AndroidLauncher && window.AndroidLauncher.performHaptics) {
    try { window.AndroidLauncher.performHaptics(); } catch (e) {}
  }
}

function loadDeviceInfo() {
  if (window.AndroidLauncher && window.AndroidLauncher.getDeviceInfo) {
    try {
      const info = JSON.parse(window.AndroidLauncher.getDeviceInfo());
      if (info && info.model) {
        document.getElementById('device-model-val').innerText = `Model: ${info.manufacturer || ''} ${info.model}`;
        document.getElementById('device-sdk-val').innerText = `Android Version: ${info.androidVersion || ''}`;
        document.getElementById('user-name-display').innerText = `${info.model} User`;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

function loadRealInstalledApps() {
  if (window.AndroidLauncher && window.AndroidLauncher.getInstalledApps) {
    try {
      const jsonStr = window.AndroidLauncher.getInstalledApps();
      const rawList = JSON.parse(jsonStr);

      if (rawList && rawList.length > 0) {
        INSTALLED_APPS = rawList.map(item => ({
          name: item.name,
          packageName: item.packageName,
          iconUrl: item.icon
        }));
        
        INSTALLED_APPS.sort((a, b) => a.name.localeCompare(b.name));
        renderDesktopGrid(INSTALLED_APPS);
        renderStartMenuGrid(INSTALLED_APPS);
        return;
      }
    } catch (err) {
      console.error("Native apps load error:", err);
    }
  }

  INSTALLED_APPS = MOCK_FALLBACK_APPS;
  renderDesktopGrid(INSTALLED_APPS);
  renderStartMenuGrid(INSTALLED_APPS);
}

function renderDesktopGrid(appList) {
  const container = document.getElementById('desktop-grid');
  if (!container) return;
  container.innerHTML = '';

  // Render top 12 desktop shortcuts
  appList.slice(0, 12).forEach(app => {
    const item = document.createElement('div');
    item.className = 'desktop-item';
    item.onclick = () => {
      triggerHaptic();
      triggerAppLaunch(app);
    };

    let pressTimer;
    item.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        triggerHaptic();
        openAppModal(app);
      }, 550);
    });
    item.addEventListener('touchend', () => clearTimeout(pressTimer));
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      triggerHaptic();
      openAppModal(app);
    });

    const iconHtml = app.iconUrl 
      ? `<img src="${app.iconUrl}" style="width:100%; height:100%; object-fit:contain;" />`
      : app.icon || '📱';

    item.innerHTML = `
      <div class="desktop-icon">${iconHtml}</div>
      <div class="desktop-label" title="${app.name}">${app.name}</div>
    `;
    container.appendChild(item);
  });
}

function renderStartMenuGrid(appList) {
  const container = document.getElementById('start-apps-grid');
  if (!container) return;
  container.innerHTML = '';

  appList.forEach(app => {
    const item = document.createElement('div');
    item.className = 'desktop-item';
    item.onclick = () => {
      triggerHaptic();
      closeStartMenu();
      triggerAppLaunch(app);
    };

    let pressTimer;
    item.addEventListener('touchstart', () => {
      pressTimer = setTimeout(() => {
        triggerHaptic();
        openAppModal(app);
      }, 550);
    });
    item.addEventListener('touchend', () => clearTimeout(pressTimer));
    item.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      triggerHaptic();
      openAppModal(app);
    });

    const iconHtml = app.iconUrl 
      ? `<img src="${app.iconUrl}" style="width:100%; height:100%; object-fit:contain;" />`
      : app.icon || '📱';

    item.innerHTML = `
      <div class="desktop-icon">${iconHtml}</div>
      <div class="desktop-label" title="${app.name}">${app.name}</div>
    `;
    container.appendChild(item);
  });
}

function filterStartApps(query) {
  const q = query.toLowerCase().trim();
  if (!q) {
    renderStartMenuGrid(INSTALLED_APPS);
  } else {
    const filtered = INSTALLED_APPS.filter(a => a.name.toLowerCase().includes(q));
    renderStartMenuGrid(filtered);
  }
}

function clearStartSearch() {
  const startInput = document.getElementById('start-search-input');
  const clearBtn = document.getElementById('start-search-clear');
  startInput.value = '';
  clearBtn.style.display = 'none';
  renderStartMenuGrid(INSTALLED_APPS);
}

function toggleStartMenu(focusSearch = false) {
  triggerHaptic();
  const modal = document.getElementById('start-menu-modal');
  modal.classList.toggle('active');
  if (focusSearch && modal.classList.contains('active')) {
    setTimeout(() => {
      document.getElementById('start-search-input').focus();
    }, 200);
  }
}

function closeStartMenu() {
  const modal = document.getElementById('start-menu-modal');
  if (modal) modal.classList.remove('active');
}

function toggleWidgetsBoard() {
  triggerHaptic();
  const board = document.getElementById('widgets-board');
  board.classList.toggle('active');
}

function closeWidgetsBoard() {
  const board = document.getElementById('widgets-board');
  if (board) board.classList.remove('active');
}

function toggleAllAppsView() {
  triggerHaptic();
  ALL_APPS_VIEW = !ALL_APPS_VIEW;
  const label = document.getElementById('section-label');
  const btn = document.getElementById('all-apps-toggle');

  if (ALL_APPS_VIEW) {
    label.innerText = 'All Applications';
    btn.innerText = '‹ Pinned';
  } else {
    label.innerText = 'Pinned Apps';
    btn.innerText = 'All Apps ›';
  }
  renderStartMenuGrid(INSTALLED_APPS);
}

function triggerAppLaunch(app) {
  if (app.packageName && window.AndroidLauncher && window.AndroidLauncher.launchApp) {
    const launched = window.AndroidLauncher.launchApp(app.packageName);
    if (!launched) {
      alert(`Unable to launch ${app.name}`);
    }
  } else {
    alert(`🚀 Launching ${app.name}...`);
  }
}

function searchWeb(query) {
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  if (window.AndroidLauncher && window.AndroidLauncher.launchApp) {
    window.AndroidLauncher.launchApp('com.android.chrome');
  } else {
    window.open(url, '_blank');
  }
}

function updateTrayClock() {
  const now = new Date();
  let hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12;

  const clockElem = document.getElementById('tray-clock');
  if (clockElem) clockElem.innerText = `${hours}:${minutes} ${ampm}`;
}

function setDefaultHomeLauncher() {
  triggerHaptic();
  if (window.AndroidLauncher && window.AndroidLauncher.setAsDefaultHome) {
    window.AndroidLauncher.setAsDefaultHome();
  } else {
    alert('📱 Select Windows 11 Launcher as your Home app in Android Settings!');
  }
}

function openSystemSettings() {
  triggerHaptic();
  if (window.AndroidLauncher && window.AndroidLauncher.openSettings) {
    window.AndroidLauncher.openSettings();
  } else {
    alert('⚙️ Opening Android Settings...');
  }
}

function openWallpaperPicker() {
  triggerHaptic();
  if (window.AndroidLauncher && window.AndroidLauncher.openWallpaperPicker) {
    window.AndroidLauncher.openWallpaperPicker();
  } else {
    alert('🖼️ Select Wallpaper from Device Gallery');
  }
}

function launchFileExplorer() {
  triggerHaptic();
  if (window.AndroidLauncher && window.AndroidLauncher.launchApp) {
    window.AndroidLauncher.launchApp('com.google.android.documentsui');
  } else {
    alert('📁 Opening File Manager...');
  }
}

function launchChrome() {
  triggerHaptic();
  if (window.AndroidLauncher && window.AndroidLauncher.launchApp) {
    window.AndroidLauncher.launchApp('com.android.chrome');
  } else {
    alert('🌐 Opening Browser...');
  }
}

function openAppModal(app) {
  CURRENT_APP_SELECTED = app;
  document.getElementById('app-modal-title').innerText = app.name;
  document.getElementById('app-modal-pkg').innerText = app.packageName || 'com.example.app';

  const iconContainer = document.getElementById('app-modal-icon');
  if (app.iconUrl) {
    iconContainer.innerHTML = `<img src="${app.iconUrl}" style="width:44px; height:44px; object-fit:contain;" />`;
  } else {
    iconContainer.innerHTML = app.icon || '📱';
  }

  document.getElementById('btn-launch-modal').onclick = () => {
    triggerHaptic();
    closeAppModal();
    triggerAppLaunch(app);
  };

  document.getElementById('btn-info-modal').onclick = () => {
    triggerHaptic();
    closeAppModal();
    if (app.packageName && window.AndroidLauncher && window.AndroidLauncher.openAppDetails) {
      window.AndroidLauncher.openAppDetails(app.packageName);
    } else {
      alert(`App Info: ${app.packageName}`);
    }
  };

  document.getElementById('btn-uninstall-modal').onclick = () => {
    triggerHaptic();
    closeAppModal();
    if (app.packageName && window.AndroidLauncher && window.AndroidLauncher.uninstallApp) {
      window.AndroidLauncher.uninstallApp(app.packageName);
    } else {
      alert(`Uninstall: ${app.packageName}`);
    }
  };

  document.getElementById('app-modal').classList.add('active');
}

function closeAppModal() {
  document.getElementById('app-modal').classList.remove('active');
}
