import axios from '../utils/http';

export default class SubmissionService {
    static deleteFileSubmission(id: string) {
        axios.delete(`/file_submission/${id}`);
    }
}