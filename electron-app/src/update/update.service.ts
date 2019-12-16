import { Injectable, Logger, BadRequestException, Inject } from '@nestjs/common';
import { EventsGateway } from 'src/events/events.gateway';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import * as logger from 'electron-log';
import { AppGlobal } from 'src/app-global.interface';

enum UpdateEvent {
  AVAILABLE = '[UPDATE] AVAILABLE',
  BLOCKED = '[UPDATE] BLOCKED RESTART',
  ERROR = '[UPDATE] ERROR',
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
  private DEBUG_MODE: boolean = (global as AppGlobal).DEBUG_MODE;

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
    autoUpdater.fullChangelog = true;

    autoUpdater.on('checking-for-update', () => this.logger.log('Checking for update...'));

    autoUpdater.on('update-available', info => {
      this.updateAvailable.available = true;
      this.updateAvailable.releaseNotes = info.releaseNotes.map(
        note => `<h2>${note.version}</h2>${note.note}`,
      );
      this.updateAvailable.version = info.version;
      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('download-progress', ({ percent }) => {
      this.updateAvailable.percent = percent;
      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('error', err => {
      this.isUpdating = false;
      this.updateAvailable.isUpdating = false;
      this.updateAvailable.error = err;
      this.updateAvailable.percent = 0;

      logger.error(err);
      this.logger.error(err);

      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
      this.eventEmitter.emit(UpdateEvent.ERROR, err);
    });

    autoUpdater.on('update-downloaded', () => {
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

    this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
    autoUpdater.downloadUpdate();
  }

  private checkForUpdate() {
    if (this.updateAvailable.available || this.DEBUG_MODE || this.isUpdating) {
      return;
    }

    autoUpdater.checkForUpdates();
  }
}
