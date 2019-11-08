import axios from '../utils/http';

export default class SubmissionService {
    static deleteSubmission(id: string) {
        axios.delete(`/submission/${id}`);
    }
}