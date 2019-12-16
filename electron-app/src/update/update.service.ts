import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import * as logger from 'electron-log';

enum UpdateEvent {
  AVAILABLE = '[UPDATE] AVAILABLE',
  BLOCKED = '[UPDATE] BLOCKED RESTART',
  ERROR = '[UPDATE] ERROR',
  PROGRESS = '[UPDATE] PROGRESS',
  UPDATING = '[UPDATE] UPDATING',
}

interface UpdateInfo {
  available: boolean;
  error: string;
  isUpdating: boolean;
  percent: number;
  releaseNotes: string;
  version: string;
}

@Injectable()
export class UpdateService {
  private readonly logger: Logger = new Logger(UpdateService.name);
  private DEBUG_MODE: boolean = !!process.env.DEVMODE;

  private isUpdating: boolean = false;
  private updateAvailable: UpdateInfo = {
    available: false,
    error: '',
    isUpdating: false,
    percent: 0,
    releaseNotes: '',
    version: '',
  };

  constructor(private readonly eventEmitter: EventsGateway) {
    logger.transports.file.level = 'info';
    autoUpdater.logger = logger;
    autoUpdater.autoDownload = false;

    autoUpdater.on('checking-for-update', () => this.logger.log('Checking for update...'));

    autoUpdater.on('update-available', info => {
      this.updateAvailable.available = true;
      this.updateAvailable.releaseNotes = info.releaseNotes;
      this.updateAvailable.version = info.version;
      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('download-progress', ({ percent }) => {
      this.eventEmitter.emit(UpdateEvent.PROGRESS, percent);
      this.updateAvailable.percent = percent;
    });

    autoUpdater.on('error', err => {
      this.isUpdating = false;
      this.updateAvailable.isUpdating = false;
      this.updateAvailable.error = err;
      this.updateAvailable.percent = 0;

      logger.error(err);
      this.logger.error(err);

      this.eventEmitter.emit(UpdateEvent.UPDATING, false);
      this.eventEmitter.emit(UpdateEvent.ERROR, err);
    });

    autoUpdater.on('update-downloaded', () => {
      this.eventEmitter.emit(UpdateEvent.PROGRESS, 100);
      this.updateAvailable.percent = 100;
      this.updateAvailable.isUpdating = false;
      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
      // TODO need to check for posting status
      const isPosting: boolean = false;
      if (!isPosting) {
        BrowserWindow.getAllWindows().forEach(w => {
          w.destroy();
        });

        setTimeout(() => autoUpdater.quitAndInstall(false, true), 1000);
      } else {
        this.eventEmitter.emit(UpdateEvent.BLOCKED, true);
      }
    });

    setTimeout(() => this.checkForUpdate(), 5000); // initial check
    setInterval(() => this.checkForUpdate(), 60000 * 60); // hourly check
  }

  public updateInfo() {
    return this.updateAvailable || {};
  }

  public async update() {
    if (!this.updateAvailable || this.DEBUG_MODE) {
      throw new BadRequestException('No update available');
    }

    if (this.isUpdating) {
      throw new BadRequestException('Already updating');
    }

    // TODO need to check for posting status
    const isPosting: boolean = false;
    if (isPosting) {
      this.eventEmitter.emit(UpdateEvent.BLOCKED, true);
      return;
    }

    this.logger.log('Updating PostyBirb...');

    this.isUpdating = true;
    this.updateAvailable.isUpdating = true;

    this.eventEmitter.emit(UpdateEvent.UPDATING, true);
    autoUpdater.downloadUpdate();
  }

  private checkForUpdate() {
    if (this.updateAvailable.available || this.DEBUG_MODE || this.isUpdating) {
      return;
    }

    autoUpdater.checkForUpdates();
  }
}
