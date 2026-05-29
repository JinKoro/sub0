/** Канал доставки уведомления. EMAIL работает в MVP; TELEGRAM и MAX
 *  подключатся отдельной задачей (link-flow через notification_channel
 *  + verified_at). До подключения матрица их хранит, но воркер пропускает. */
export enum NotificationChannelType {
  EMAIL = 1,
  TELEGRAM = 2,
  MAX = 3,
}
