import { Session, SessionData } from 'express-session'

export type ISession = Session & Partial<SessionData> & { uid: number }
