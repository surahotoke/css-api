/** サービスが管理する予約空間のプレフィックス（汎用 API からは読み取りのみ） */
export const ENV = 'env_'

/** 汎用 cookie API が読み書きするユーザー空間のプレフィックス */
export const VAR = 'var_'

export type CookiePrefix = typeof ENV | typeof VAR
