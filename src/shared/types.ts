// ============================================================
// 别名查询（LCU: /lol-summoner/v1/alias/lookup）
// ============================================================

export interface AliasLookup {
  alias: {
    gameName: string;
    tagLine: string;
  };
  puuid: string;
}

// ============================================================
// 登录会话（LCU API: /lol-login/v1/session）
// ============================================================

export interface LoginSession {
  /** 账号 ID */
  accountId: number;
  /** 是否已连接到 LCU */
  connected: boolean;
  /** 错误信息（无错误时为 null） */
  error: null | string;
  /** JWT ID token，payload 中包含平台 ID（lol[0].cpid） */
  idToken: string;
  /** 是否在登录队列中 */
  isInLoginQueue: boolean;
  /** 是否新玩家 */
  isNewPlayer: boolean;
  /** PUUID（全局唯一玩家标识） */
  puuid: string;
  /** 登录状态（SUCCEEDED=成功） */
  state: 'SUCCEEDED' | string;
  /** 召唤师 ID */
  summonerId: number;
  /** 用户认证 token（可能为空） */
  userAuthToken: string;
  /** 用户名 */
  username: string;
}

// ============================================================
// 召唤师信息（LCU API: /lol-summoner/v1/current-summoner）
// ============================================================

export interface SummonerInfo {
  /** 账号 ID */
  accountId: number;
  /** 显示名称 */
  displayName: string;
  /** 游戏内名称（不带 tagLine） */
  gameName: string;
  /** 内部名称 */
  internalName: string;
  /** 是否改过名 */
  nameChangeFlag: boolean;
  /** 当前等级升级进度百分比 */
  percentCompleteForNextLevel: number;
  /** 隐私设置 */
  privacy: string;
  /** 头像 ID */
  profileIconId: number;
  /** PUUID（全局唯一玩家标识） */
  puuid: string;
  /** 骰子/重随点数信息（仅 ARAM 等模式相关） */
  rerollPoints: {
    /** 当前拥有点数 */
    currentPoints: number;
    /** 最大重随次数 */
    maxRolls: number;
    /** 当前可用重随次数 */
    numberOfRolls: number;
    /** 每次重随消耗的点数 */
    pointsCostToRoll: number;
    /** 攒够一次重随所需的点数 */
    pointsToReroll: number;
  };
  /** 召唤师 ID */
  summonerId: number;
  /** 召唤师等级 */
  summonerLevel: number;
  /** 后缀标签（#后面的部分） */
  tagLine: string;
  /** 是否为未命名用户 */
  unnamed: boolean;
  /** 当前等级已获得经验 */
  xpSinceLastLevel: number;
  /** 升级所需总经验 */
  xpUntilNextLevel: number;
}

// ============================================================
// 比赛记录（LCU API: /lol-match-history/v1/products/lol/current-summoner/matches）
// ============================================================

/** 比赛记录分页响应 */
export interface MatchInfo {
  /** 当前查询的账号 ID */
  accountId: number;
  /** 分页容器 */
  games: {
    gameBeginDate: string;
    /** 总比赛数量 */
    gameCount: number;
    gameEndDate: string;
    /** 当前分页起始索引 */
    gameIndexBegin: number;
    /** 当前分页结束索引 */
    gameIndexEnd: number;
    /** 比赛列表 */
    games: Game[];
  };
  /** 平台 ID（如 HN1=台服） */
  platformId: string;
}

/** 单场比赛 */
export interface Game {
  /** 游戏结束状态（GameComplete=正常结束） */
  endOfGameResult: string;
  /** 游戏创建时间戳（毫秒） */
  gameCreation: number;
  /** 游戏创建时间 ISO 字符串 */
  gameCreationDate: string;
  /** 游戏时长（秒） */
  gameDuration: number;
  /** 游戏 ID */
  gameId: number;
  /** 游戏模式（CLASSIC=召唤师峡谷, KIWI=嚎哭深渊, ARAM=极地大乱斗） */
  gameMode: string;
  /** 模式变体（如地图皮肤） */
  gameModeMutators: string[];
  /** 游戏类型（MATCHED_GAME=匹配, CUSTOM_GAME=自定义） */
  gameType: string;
  /** 游戏版本 */
  gameVersion: string;
  /** 地图 ID（11=召唤师峡谷, 12=嚎哭深渊） */
  mapId: number;
  /** 参与者身份列表（用于关联玩家 PUUID） */
  participantIdentities: ParticipantIdentity[];
  /** 参与者数据列表（实际对局数据，通过 participantId 与 identities 关联） */
  participants: Participant[];
  /** 平台 ID */
  platformId: string;
  /** 队列 ID（420=单双排, 440=灵活排位, 450=极地大乱斗, 2400=斗魂竞技场） */
  queueId: number;
  /** 赛季 ID */
  seasonId: number;
  /** 双方队伍信息 */
  teams: Team[];
}

/** 参与者身份 */
export interface ParticipantIdentity {
  participantId: number;
  player: {
    accountId: number;
    currentAccountId: number;
    currentPlatformId: string;
    /** 游戏内名称 */
    gameName: string;
    matchHistoryUri: string;
    platformId: string;
    /** 头像 ID */
    profileIcon: number;
    /** PUUID（全局唯一） */
    puuid: string;
    /** 召唤师 ID */
    summonerId: number;
    summonerName: string;
    /** 后缀标签 */
    tagLine: string;
  };
}

/** 参与者对局数据 */
export interface Participant {
  /** 英雄 ID */
  championId: number;
  /** 历史最高段位 */
  highestAchievedSeasonTier: string;
  participantId: number;
  /** 召唤师技能 1 ID */
  spell1Id: number;
  /** 召唤师技能 2 ID */
  spell2Id: number;
  /** 详细统计数据 */
  stats: ParticipantStats;
  /** 队伍 ID（100=蓝方, 200=红方） */
  teamId: number;
  /** 时间线数据（每分钟增量） */
  timeline: ParticipantTimeline;
}

/** 参与者详细统计 */
export interface ParticipantStats {
  /** 助攻数 */
  assists: number;
  /** 是否发起提前投降 */
  causedEarlySurrender: boolean;
  /** 英雄等级 */
  champLevel: number;
  combatPlayerScore: number;
  /** 对史诗野怪/防御塔造成的伤害 */
  damageDealtToObjectives: number;
  /** 对防御塔造成的伤害 */
  damageDealtToTurrets: number;
  /** 自我减伤（护盾/抗性抵消的伤害） */
  damageSelfMitigated: number;
  /** 死亡数 */
  deaths: number;
  /** 双杀次数 */
  doubleKills: number;
  earlySurrenderAccomplice: boolean;
  /** 是否参与一血 */
  firstBloodAssist: boolean;
  /** 是否拿到一血 */
  firstBloodKill: boolean;
  firstInhibitorAssist: boolean;
  firstInhibitorKill: boolean;
  /** 是否参与推掉第一座塔 */
  firstTowerAssist: boolean;
  /** 是否推掉第一座塔 */
  firstTowerKill: boolean;
  /** 游戏是否以提前投降结束 */
  gameEndedInEarlySurrender: boolean;
  /** 游戏是否以投降结束 */
  gameEndedInSurrender: boolean;
  /** 获得金币 */
  goldEarned: number;
  /** 花费金币 */
  goldSpent: number;
  /** 摧毁水晶数 */
  inhibitorKills: number;
  /** 装备栏 0-6（0-5=常规装备, 6=饰品栏, 物品 ID） */
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  /** 饰品栏 */
  item6: number;
  /** 连杀次数（如 double kill, triple kill 等） */
  killingSprees: number;
  /** 击杀数 */
  kills: number;
  /** 最大暴击伤害 */
  largestCriticalStrike: number;
  /** 最大连杀（连续击杀数） */
  largestKillingSpree: number;
  /** 最大多杀（2=双杀, 3=三杀, 4=四杀, 5=五杀） */
  largestMultiKill: number;
  /** 最长存活时间（秒） */
  longestTimeSpentLiving: number;
  /** 魔法伤害 */
  magicDamageDealt: number;
  /** 对英雄造成的魔法伤害 */
  magicDamageDealtToChampions: number;
  /** 承受的魔法伤害 */
  magicalDamageTaken: number;
  /** 中立生物击杀数 */
  neutralMinionsKilled: number;
  /** 敌方野区野怪击杀数 */
  neutralMinionsKilledEnemyJungle: number;
  /** 己方野区野怪击杀数 */
  neutralMinionsKilledTeamJungle: number;
  objectivePlayerScore: number;
  participantId: number;
  /** 五杀次数 */
  pentaKills: number;
  /** 符文 0（主系基石）ID 及变量 */
  perk0: number;
  perk0Var1: number;
  perk0Var2: number;
  perk0Var3: number;
  /** 符文 1 ID 及变量 */
  perk1: number;
  perk1Var1: number;
  perk1Var2: number;
  perk1Var3: number;
  /** 符文 2 ID 及变量 */
  perk2: number;
  perk2Var1: number;
  perk2Var2: number;
  perk2Var3: number;
  /** 符文 3 ID 及变量 */
  perk3: number;
  perk3Var1: number;
  perk3Var2: number;
  perk3Var3: number;
  /** 符文 4（副系第一行）ID 及变量 */
  perk4: number;
  perk4Var1: number;
  perk4Var2: number;
  perk4Var3: number;
  /** 符文 5（副系第二行）ID 及变量 */
  perk5: number;
  perk5Var1: number;
  perk5Var2: number;
  perk5Var3: number;
  /** 主系符文页 ID */
  perkPrimaryStyle: number;
  /** 副系符文页 ID */
  perkSubStyle: number;
  /** 物理伤害 */
  physicalDamageDealt: number;
  /** 对英雄造成的物理伤害 */
  physicalDamageDealtToChampions: number;
  /** 承受的物理伤害 */
  physicalDamageTaken: number;
  /** 斗魂竞技场强化 1-6 */
  playerAugment1: number;
  playerAugment2: number;
  playerAugment3: number;
  playerAugment4: number;
  playerAugment5: number;
  playerAugment6: number;
  /** 游戏内评分（0-9） */
  playerScore0: number;
  playerScore1: number;
  playerScore2: number;
  playerScore3: number;
  playerScore4: number;
  playerScore5: number;
  playerScore6: number;
  playerScore7: number;
  playerScore8: number;
  playerScore9: number;
  playerSubteamId: number;
  /** 四杀次数 */
  quadraKills: number;
  /** 角色绑定装备（打野刀/辅助装 ID） */
  roleBoundItem: number;
  sightWardsBoughtInGame: number;
  subteamPlacement: number;
  teamEarlySurrendered: boolean;
  /** 控制敌方英雄时间（秒） */
  timeCCingOthers: number;
  /** 总伤害 */
  totalDamageDealt: number;
  /** 对英雄造成的总伤害 */
  totalDamageDealtToChampions: number;
  /** 承受总伤害 */
  totalDamageTaken: number;
  /** 总治疗量 */
  totalHeal: number;
  /** 补刀数 */
  totalMinionsKilled: number;
  totalPlayerScore: number;
  totalScoreRank: number;
  /** 控制效果总时长（秒） */
  totalTimeCrowdControlDealt: number;
  /** 治疗友方单位数 */
  totalUnitsHealed: number;
  /** 三杀次数 */
  tripleKills: number;
  /** 真实伤害 */
  trueDamageDealt: number;
  /** 对英雄造成的真实伤害 */
  trueDamageDealtToChampions: number;
  /** 承受的真实伤害 */
  trueDamageTaken: number;
  /** 摧毁防御塔数 */
  turretKills: number;
  unrealKills: number;
  /** 视野得分 */
  visionScore: number;
  /** 购买真眼数量 */
  visionWardsBoughtInGame: number;
  /** 排眼数 */
  wardsKilled: number;
  /** 插眼数 */
  wardsPlaced: number;
  /** 是否获胜 */
  win: boolean;
}

/** 时间线数据（每分钟增量，key 为 "0-10" 等时间段标识） */
export interface ParticipantTimeline {
  /** 每分钟补刀 */
  creepsPerMinDeltas: Record<string, number>;
  /** 每分钟补刀差（相对对位） */
  csDiffPerMinDeltas: Record<string, number>;
  /** 每分钟承受伤害差 */
  damageTakenDiffPerMinDeltas: Record<string, number>;
  /** 每分钟承受伤害 */
  damageTakenPerMinDeltas: Record<string, number>;
  /** 每分钟金币 */
  goldPerMinDeltas: Record<string, number>;
  /** 分路（MIDDLE=中路, TOP=上路, BOTTOM=下路, JUNGLE=打野, NONE=无固定分路） */
  lane: string;
  participantId: number;
  /** 定位（SOLO=单人线, SUPPORT=辅助, CARRY=核心输出, NONE=无） */
  role: string;
  /** 每分钟经验差 */
  xpDiffPerMinDeltas: Record<string, number>;
  /** 每分钟经验 */
  xpPerMinDeltas: Record<string, number>;
}

/** 队伍信息 */
export interface Team {
  /** 禁用英雄列表 */
  bans: Array<{ championId: number; pickTurn: number }>;
  /** 击杀大龙数 */
  baronKills: number;
  dominionVictoryScore: number;
  /** 击杀小龙数 */
  dragonKills: number;
  /** 是否拿到第一条大龙 */
  firstBaron: boolean;
  /** 是否拿到一血 */
  firstBlood: boolean;
  /** 是否拿到第一条小龙 */
  firstDargon: boolean;
  /** 是否摧毁第一个水晶 */
  firstInhibitor: boolean;
  /** 是否摧毁第一座塔 */
  firstTower: boolean;
  /** 击杀虚空巢虫数量 */
  hordeKills: number;
  /** 摧毁水晶数 */
  inhibitorKills: number;
  /** 击杀峡谷先锋数 */
  riftHeraldKills: number;
  /** 队伍 ID（100=蓝方, 200=红方） */
  teamId: number;
  /** 摧毁防御塔数 */
  towerKills: number;
  /** 击杀卑鄙之喉数量（扭曲丛林地图） */
  vilemawKills: number;
  /** 胜负（Win/Fail） */
  win: string;
}

// ============================================================
// 登录 Token Payload（JWT idToken 解析结果）
// ============================================================

export interface LoginTokenPayload {
  sub: string;
  aud: string;
  country: string;
  iss: string;
  lol: Array<{
    uid: number;
    cuid: number;
    uname: string;
    /** 当前平台 ID（如 HN1=电信一区艾欧尼亚） */
    cpid: string;
    ptrid: string;
    /** 平台 ID */
    pid: string;
    state: string;
  }>;
  exp: number;
  iat: number;
  acct: {
    game_name: string;
    state: string;
    tag_line: string;
  };
}