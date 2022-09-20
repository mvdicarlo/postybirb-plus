import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { EventsGateway } from 'src/server/events/events.gateway';
import { autoUpdater } from 'electron-updater';
import { BrowserWindow } from 'electron';
import { PostService } from 'src/server/submission/post/post.service';
import { Interval } from '@nestjs/schedule';
import { CustomLogger } from 'src/server/custom.logger';
import { Events } from 'postybirb-commons';

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
  private DEBUG_MODE: boolean = global.DEBUG_MODE;

  private isUpdating: boolean = false;
  private updateAvailable: UpdateInfo = {
    available: false,
    error: '',
    isUpdating: false,
    percent: 0,
    releaseNotes: '',
    version: '',
  };

  constructor(
    private readonly eventEmitter: EventsGateway,
    private readonly postService: PostService,
  ) {
    autoUpdater.logger = CustomLogger.logger;
    autoUpdater.autoDownload = false;
    autoUpdater.fullChangelog = true;

    autoUpdater.on('checking-for-update', () => this.logger.log('Checking for update...'));

    autoUpdater.on('update-available', (info) => {
      this.updateAvailable.available = true;
      if (Array.isArray(info.releaseNotes)) {
        this.updateAvailable.releaseNotes = (info.releaseNotes as any[])
          .map((note) => `<h2>${note.version}</h2>${note.note}`)
          .join('\n');
      }

      this.updateAvailable.version = info.version;
      this.eventEmitter.emit(Events.UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('download-progress', ({ percent }) => {
      this.updateAvailable.percent = percent;
      this.eventEmitter.emit(Events.UpdateEvent.AVAILABLE, this.updateAvailable);
    });

    autoUpdater.on('error', (err) => {
      this.isUpdating = false;
      this.updateAvailable.isUpdating = false;
      this.updateAvailable.error = err.toString();
      this.updateAvailable.percent = 0;

      this.logger.error(err);

      this.eventEmitter.emit(Events.UpdateEvent.AVAILABLE, this.updateAvailable);
      this.eventEmitter.emit(Events.UpdateEvent.ERROR, err);
    });

    autoUpdater.on('update-downloaded', () => {
      this.updateAvailable.percent = 100;
      this.updateAvailable.isUpdating = false;
      this.eventEmitter.emit(Events.UpdateEvent.AVAILABLE, this.updateAvailable);

      if (!this.postService.isCurrentlyPostingToAny()) {
        BrowserWindow.getAllWindows().forEach((w) => {
          w.destroy();
        });

        setTimeout(() => autoUpdater.quitAndInstall(false, true), 1000);
      } else {
        this.eventEmitter.emit(Events.UpdateEvent.BLOCKED, true);
      }
    });

    setTimeout(() => this.checkForUpdate(), 5000); // initial check
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

    this.logger.log('Updating PostyBirb...');

    this.isUpdating = true;
    this.updateAvailable.isUpdating = true;
    this.updateAvailable.error = '';

    this.eventEmitter.emit(Events.UpdateEvent.AVAILABLE, this.updateAvailable);
    autoUpdater.downloadUpdate();
  }

  @Interval(3600000)
  public checkForUpdate() {
    if (this.updateAvailable.available || this.DEBUG_MODE || this.isUpdating) {
      return;
    }

    autoUpdater.checkForUpdates();
  }
}
