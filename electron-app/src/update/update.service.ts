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
}

@Injectable()
export class UpdateService {
  private readonly logger: Logger = new Logger(UpdateService.name);
  private updateAvailable: any;
  private DEBUG_MODE: boolean = !!process.env.DEVMODE;

  constructor(private readonly eventEmitter: EventsGateway) {
    logger.transports.file.level = 'info';
    autoUpdater.logger = logger;
    autoUpdater.autoDownload = false;

    autoUpdater.on('checking-for-update', () => this.logger.log('Checking for update...'));

    autoUpdater.on('update-available', info => {
      this.updateAvailable = true;
      this.updateAvailable = {
        releaseNotes: info.releaseNotes,
        version: info.version,
      };
      this.eventEmitter.emit(UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('download-progress', ({ percent }) => {
      this.eventEmitter.emit(UpdateEvent.PROGRESS, percent);
      this.updateAvailable.percent = percent;
    });

    autoUpdater.on('error', err => {
      logger.error(err);
      this.logger.error(err);
      this.eventEmitter.emit(UpdateEvent.ERROR, err);
      this.updateAvailable.error = err;
    });

    autoUpdater.on('update-downloaded', () => {
      this.eventEmitter.emit(UpdateEvent.PROGRESS, 100);
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

    // TODO need to check for posting status
    const isPosting: boolean = false;
    if (isPosting) {
      this.eventEmitter.emit(UpdateEvent.BLOCKED, true);
      return;
    }

    this.logger.log('Updating PostyBirb...');
    autoUpdater.downloadUpdate();
  }

  private checkForUpdate() {
    if (this.updateAvailable || this.DEBUG_MODE) {
      return;
    }

    autoUpdater.checkForUpdates();
  }
}
