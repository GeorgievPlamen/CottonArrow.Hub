export type UserCtx = { id: string; username: string };

export enum MessageTypes {
  users = "users",
  signalOffer = "signal:offer",
  signalAnswer = "signal:answer",
  signalIce = "signal:ice-candidate",
}

export interface ActiveUsersMessage {
  type: MessageTypes.users;
  activeUsersCount: number;
  Users: UserCtx[];
}

export interface OfferMessage {
  type: MessageTypes.signalOffer;
  from: string;
  to: string;
  sdp: string;
}

export interface AnswerMessage {
  type: MessageTypes.signalAnswer;
  from: string;
  to: string;
  sdp: string;
}

export interface IceMessage {
  type: MessageTypes.signalIce;
  from: string;
  to: string;
  candidate: string;
}

export type WSMessage =
  | OfferMessage
  | AnswerMessage
  | IceMessage;
