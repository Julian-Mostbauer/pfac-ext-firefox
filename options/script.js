// Saves options to browser.storage
function saveOptions() {
  const autoFactorize = document.getElementById('auto-factorize').checked;
  browser.storage.local.set({
    autoFactorize: autoFactorize
  }).then(() => {
    // Update status to let user know options were saved.
    const status = document.getElementById('status');
    status.style.opacity = 1;
    setTimeout(() => {
      status.style.opacity = 0;
    }, 2000);
  });
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.
function restoreOptions() {
  browser.storage.local.get({
    autoFactorize: false // default value
  }).then((items) => {
    document.getElementById('auto-factorize').checked = items.autoFactorize;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('auto-factorize').addEventListener('change', saveOptions);
