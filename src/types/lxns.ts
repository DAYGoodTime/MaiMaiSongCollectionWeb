export interface LXNSScore {
  /** 曲目 ID */
  id: number;
  /** 曲名  */
  song_name: string;
  /** 难度标级  */
  level: string;
  /** 难度索引  */
  level_index: number;
  /** 达成率 (如 97.5 表示 97.50%) */
  achievements: number;
  /** FULL COMBO 类型 (可空) */
  fc: string | null;
  /** FULL SYNC 类型 (可空) */
  fs: string | null;
  /** DX 分数 */
  dx_score: number;
  /** DX rating */
  dx_rating: number;
  /** 评级类型 */
  rate_type: string;
  /** 谱面类型 */
  type: string;
  /** 游玩的 UTC 时间 (YYYY-MM-DD HH:mm 格式) */
  play_time: string | null;
  /** 谱面最后游玩的 UTC 时间 */
  last_played_time: string | null;
  /** 是否有拥有成绩（用于构建未游玩难度） */
  is_played?: boolean
}
export interface LXNSOAuth {
  access_token: string,
  access_token_expired: number,
  refresh_token: string,
  refresh_token_expired: number
}
export interface LXNSOAuthResponse {
  //访问令牌，用于访问用户数据
  access_token: string,
  //令牌类型，通常为 Bearer
  token_type: string,
  //访问令牌的有效期，单位为秒
  expires_in: number,
  //刷新令牌，用于获取新的访问令牌
  refresh_token: string,
  //授权范围，表示应用可以访问的权限
  scope: string,
}
export interface LXNSResponse<T> {
  code: number,
  success: boolean,
  data: T
}
export interface LXNSOAuthRequest {
  //应用 ID
  client_id: string,
  //应用密钥
  client_secret: string,
  //授权类型，固定为 authorization_code
  grant_type: string,
  //从回调地址获取的授权码
  code: string,
  //回调地址，必须与创建应用时一致
  redirect_uri: string
}
export interface LXNSOAuthRefresh {
  //应用 ID
  client_id: string,
  //应用密钥
  client_secret: string,
  //授权类型，固定为 authorization_code
  grant_type: string,
  refresh_token: string
}