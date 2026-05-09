import { authHandlers } from './authHandlers'
import { auctionHandlers } from './auctionHandlers'

export const handlers = [
  ...authHandlers,
  ...auctionHandlers,
]
