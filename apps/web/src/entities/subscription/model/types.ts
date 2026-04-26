export type SubscriptionStatus = 'active' | 'trial' | 'paused'

export interface Subscription {
  name: string
  char: string
  cat: string
  catEn: string
  price: number
  cycle: string
  cycleEn: string
  next: string
  nextEn: string
  status: SubscriptionStatus
  color: string
}
