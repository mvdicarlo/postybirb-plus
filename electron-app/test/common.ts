import { EventsGateway } from 'src/server/events/events.gateway';

export const mockEventEmitterProvider = {
  provide: EventsGateway,
  useValue: {
    emit(event: string, data: any) {
      return;
    },

    async emitOnComplete(event: string, promise: Promise<any>) {
      return;
    },
  },
};
