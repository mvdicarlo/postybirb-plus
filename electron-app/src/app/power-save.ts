const { powerSaveBlocker } = require('electron');

let blocker: number = null;

function preventSleep() {
  if (blocker === null) {
    blocker = powerSaveBlocker.start('prevent-app-suspension');
    console.log(`App suspension blocker: enabled (${blocker})`);
  }
}

function enableSleep() {
  if (blocker !== null && powerSaveBlocker.isStarted(blocker)) {
    powerSaveBlocker.stop(blocker);
    console.log(`App suspension blocker: disabled (${blocker})`);
  }

  blocker = null;
}

export { preventSleep, enableSleep };
