import { Injectable, Logger } from '@nestjs/common';
import { Submission } from './submission.interface';
import { FileRepositoryService } from 'src/file-repository/file-repository.service';
import * as shortid from 'shortid';
import { UploadedFile } from 'src/file-repository/uploaded-file.interface';

@Injectable()
export class SubmissionService {
  private readonly logger = new Logger(SubmissionService.name);
  private submissions: Submission[] = [];

  constructor(private readonly fileRepository: FileRepositoryService) {}

  getAllSubmissions(): Submission[] {
    return this.submissions;
  }

  async createSubmission(file: UploadedFile, path: string) {
    const id = shortid.generate();
    const locations = await this.fileRepository.insertFile(id, file, path);
    const submission: Submission = {
      id,
      title: file.originalname,
      fileLocations: {
        originalPath: path,
        submission: locations.submissionLocation,
        thumbnail: locations.thumbnailLocation,
      },
      order: this.submissions.length,
      created: Date.now(),
    };
    this.submissions.push(submission);
  }

  async removeSubmission(id: string) {
    const submission: Submission = await this.getSubmission(id);
    if (submission) {
      await this.fileRepository.removeSubmissionFiles(submission);
      this.submissions.splice(this.submissions.indexOf(submission), 1);
    }
  }

  async getSubmission(id: string): Promise<Submission> {
    return Promise.resolve(this.submissions.find(s => s.id === id));
  }
}
