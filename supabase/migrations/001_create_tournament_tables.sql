-- ============================================
-- 三元宇宙扑克 - 比赛管理系统数据库
-- ============================================

-- 1. 比赛模板表（存储标准比赛结构）
CREATE TABLE IF NOT EXISTS tournament_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) NOT NULL, -- 用于搜索的标准化名称
  game_type VARCHAR(20) DEFAULT '9max', -- 6max, 9max, custom
  buy_in DECIMAL(10, 2), -- 买入金额
  level_duration INTEGER NOT NULL, -- 每级盲注持续时间（分钟）
  info TEXT, -- 比赛说明
  source VARCHAR(50) DEFAULT 'user', -- 来源：'user', 'gemini_ai', 'preset'
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 0, -- 使用次数，用于统计热门模板
  is_public BOOLEAN DEFAULT TRUE, -- 是否公开给其他用户
  
  UNIQUE(normalized_name, created_by)
);

-- 2. 盲注级别表（关联到比赛模板）
CREATE TABLE IF NOT EXISTS blind_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_template_id UUID NOT NULL REFERENCES tournament_templates(id) ON DELETE CASCADE,
  level_number INTEGER NOT NULL, -- 级别号（1, 2, 3...）
  small_blind INTEGER NOT NULL, -- 小盲
  big_blind INTEGER NOT NULL, -- 大盲
  ante INTEGER DEFAULT 0, -- 前注
  duration_minutes INTEGER, -- 该级别持续时间（如果不同于模板默认值）
  
  UNIQUE(tournament_template_id, level_number)
);

-- 3. 用户比赛实例表（用户参加的具体比赛）
CREATE TABLE IF NOT EXISTS user_tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tournament_template_id UUID REFERENCES tournament_templates(id) ON DELETE SET NULL,
  
  -- 比赛基本信息
  name VARCHAR(255) NOT NULL,
  game_type VARCHAR(20) DEFAULT '9max',
  max_players INTEGER DEFAULT 9,
  
  -- 买入时的盲注信息
  buy_in_level INTEGER DEFAULT 1, -- 买入时的盲注级别
  current_small_blind INTEGER NOT NULL, -- 买入时的小盲
  current_big_blind INTEGER NOT NULL, -- 买入时的大盲
  current_ante INTEGER DEFAULT 0, -- 买入时的前注
  level_duration INTEGER NOT NULL, -- 升盲时间（分钟/级）
  time_left_in_level INTEGER, -- 该级别还剩多久升盲（分钟）
  
  -- 财务信息
  buy_in_amount DECIMAL(10, 2), -- 买入金额
  cash_out_amount DECIMAL(10, 2), -- 兑现金额
  
  -- 比赛进度
  status VARCHAR(20) DEFAULT 'active', -- active, finished
  total_entries INTEGER, -- 总参赛人数
  finish_position INTEGER, -- 完成名次
  
  -- 时间戳
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 手牌记录表（关联到用户比赛）
CREATE TABLE IF NOT EXISTS hand_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_tournament_id UUID REFERENCES user_tournaments(id) ON DELETE SET NULL,
  
  -- 比赛信息（冗余存储，方便查询）
  tournament_name VARCHAR(255),
  game_type VARCHAR(20),
  small_blind INTEGER,
  big_blind INTEGER,
  ante INTEGER,
  
  -- 手牌信息
  hero_position VARCHAR(20),
  hero_cards JSONB, -- [{rank: 'A', suit: 'hearts'}, ...]
  
  -- 行动记录
  preflop_actions JSONB,
  flop_actions JSONB,
  flop_cards JSONB,
  turn_actions JSONB,
  turn_card JSONB,
  river_actions JSONB,
  river_card JSONB,
  
  -- 笔记
  notes TEXT,
  tags TEXT[], -- 标签数组
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 索引优化
-- ============================================

-- 比赛模板索引
CREATE INDEX idx_tournament_templates_normalized_name ON tournament_templates(normalized_name);
CREATE INDEX idx_tournament_templates_created_by ON tournament_templates(created_by);
CREATE INDEX idx_tournament_templates_usage_count ON tournament_templates(usage_count DESC);
CREATE INDEX idx_tournament_templates_public ON tournament_templates(is_public) WHERE is_public = TRUE;

-- 盲注级别索引
CREATE INDEX idx_blind_levels_template_id ON blind_levels(tournament_template_id);
CREATE INDEX idx_blind_levels_level_number ON blind_levels(level_number);

-- 用户比赛实例索引
CREATE INDEX idx_user_tournaments_user_id ON user_tournaments(user_id);
CREATE INDEX idx_user_tournaments_template_id ON user_tournaments(tournament_template_id);
CREATE INDEX idx_user_tournaments_status ON user_tournaments(status);
CREATE INDEX idx_user_tournaments_started_at ON user_tournaments(started_at DESC);

-- 手牌记录索引
CREATE INDEX idx_hand_records_user_id ON hand_records(user_id);
CREATE INDEX idx_hand_records_tournament_id ON hand_records(user_tournament_id);
CREATE INDEX idx_hand_records_created_at ON hand_records(created_at DESC);

-- ============================================
-- RLS (Row Level Security) 策略
-- ============================================

-- 启用 RLS
ALTER TABLE tournament_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE hand_records ENABLE ROW LEVEL SECURITY;

-- 比赛模板策略
CREATE POLICY "公开模板所有人可读" ON tournament_templates
  FOR SELECT USING (is_public = TRUE);

CREATE POLICY "用户可读自己创建的模板" ON tournament_templates
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "用户可创建模板" ON tournament_templates
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "用户可更新自己的模板" ON tournament_templates
  FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "用户可删除自己的模板" ON tournament_templates
  FOR DELETE USING (auth.uid() = created_by);

-- 盲注级别策略（跟随模板权限）
CREATE POLICY "可读公开模板的盲注级别" ON blind_levels
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tournament_templates 
      WHERE id = blind_levels.tournament_template_id 
      AND (is_public = TRUE OR created_by = auth.uid())
    )
  );

CREATE POLICY "可创建自己模板的盲注级别" ON blind_levels
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tournament_templates 
      WHERE id = blind_levels.tournament_template_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "可更新自己模板的盲注级别" ON blind_levels
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM tournament_templates 
      WHERE id = blind_levels.tournament_template_id 
      AND created_by = auth.uid()
    )
  );

CREATE POLICY "可删除自己模板的盲注级别" ON blind_levels
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM tournament_templates 
      WHERE id = blind_levels.tournament_template_id 
      AND created_by = auth.uid()
    )
  );

-- 用户比赛实例策略
CREATE POLICY "用户可读自己的比赛" ON user_tournaments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建比赛" ON user_tournaments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的比赛" ON user_tournaments
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的比赛" ON user_tournaments
  FOR DELETE USING (auth.uid() = user_id);

-- 手牌记录策略
CREATE POLICY "用户可读自己的手牌" ON hand_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建手牌记录" ON hand_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的手牌记录" ON hand_records
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的手牌记录" ON hand_records
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 触发器：自动更新 updated_at
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tournament_templates_updated_at
  BEFORE UPDATE ON tournament_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_tournaments_updated_at
  BEFORE UPDATE ON user_tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_hand_records_updated_at
  BEFORE UPDATE ON hand_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 辅助函数
-- ============================================

-- 获取指定级别的盲注信息
CREATE OR REPLACE FUNCTION get_blind_level(
  p_tournament_template_id UUID,
  p_level_number INTEGER
)
RETURNS TABLE (
  small_blind INTEGER,
  big_blind INTEGER,
  ante INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT bl.small_blind, bl.big_blind, bl.ante
  FROM blind_levels bl
  WHERE bl.tournament_template_id = p_tournament_template_id
    AND bl.level_number = p_level_number;
END;
$$ LANGUAGE plpgsql;

-- 增加模板使用次数
CREATE OR REPLACE FUNCTION increment_template_usage(p_template_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE tournament_templates
  SET usage_count = usage_count + 1
  WHERE id = p_template_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 视图：方便查询
-- ============================================

-- 完整的比赛模板视图（包含盲注结构）
CREATE OR REPLACE VIEW tournament_templates_with_blinds AS
SELECT 
  tt.id,
  tt.name,
  tt.normalized_name,
  tt.game_type,
  tt.buy_in,
  tt.level_duration,
  tt.info,
  tt.source,
  tt.created_by,
  tt.created_at,
  tt.usage_count,
  tt.is_public,
  json_agg(
    json_build_object(
      'level_number', bl.level_number,
      'small_blind', bl.small_blind,
      'big_blind', bl.big_blind,
      'ante', bl.ante,
      'duration_minutes', COALESCE(bl.duration_minutes, tt.level_duration)
    ) ORDER BY bl.level_number
  ) AS blind_levels
FROM tournament_templates tt
LEFT JOIN blind_levels bl ON tt.id = bl.tournament_template_id
GROUP BY tt.id;

-- 用户比赛统计视图
CREATE OR REPLACE VIEW user_tournament_stats AS
SELECT 
  user_id,
  COUNT(*) AS total_tournaments,
  COUNT(*) FILTER (WHERE status = 'active') AS active_tournaments,
  COUNT(*) FILTER (WHERE status = 'finished') AS finished_tournaments,
  SUM(buy_in_amount) AS total_buy_in,
  SUM(cash_out_amount) AS total_cash_out,
  SUM(cash_out_amount) - SUM(buy_in_amount) AS net_profit
FROM user_tournaments
GROUP BY user_id;

-- ============================================
-- 初始数据：预设常见比赛模板
-- ============================================

-- 插入 WSOP Main Event
INSERT INTO tournament_templates (name, normalized_name, game_type, buy_in, level_duration, info, source, is_public)
VALUES (
  'WSOP Main Event',
  'wsop main event',
  '9max',
  10000.00,
  60,
  'WSOP 主赛事 - 深筹码结构，每级60分钟，300BB起始',
  'preset',
  TRUE
) ON CONFLICT DO NOTHING;

-- 插入 WSOP 盲注结构
WITH wsop_template AS (
  SELECT id FROM tournament_templates WHERE normalized_name = 'wsop main event' LIMIT 1
)
INSERT INTO blind_levels (tournament_template_id, level_number, small_blind, big_blind, ante)
SELECT id, 1, 100, 200, 200 FROM wsop_template
UNION ALL SELECT id, 2, 200, 300, 300 FROM wsop_template
UNION ALL SELECT id, 3, 200, 400, 400 FROM wsop_template
UNION ALL SELECT id, 4, 300, 500, 500 FROM wsop_template
UNION ALL SELECT id, 5, 300, 600, 600 FROM wsop_template
UNION ALL SELECT id, 6, 400, 800, 800 FROM wsop_template
UNION ALL SELECT id, 7, 500, 1000, 1000 FROM wsop_template
UNION ALL SELECT id, 8, 600, 1200, 1200 FROM wsop_template
UNION ALL SELECT id, 9, 800, 1600, 1600 FROM wsop_template
UNION ALL SELECT id, 10, 1000, 2000, 2000 FROM wsop_template
ON CONFLICT DO NOTHING;

-- 插入 PokerStars Sunday Million
INSERT INTO tournament_templates (name, normalized_name, game_type, buy_in, level_duration, info, source, is_public)
VALUES (
  'PokerStars Sunday Million',
  'pokerstars sunday million',
  '9max',
  215.00,
  10,
  'PokerStars Sunday Million - 快速结构，每级10分钟，500BB起始',
  'preset',
  TRUE
) ON CONFLICT DO NOTHING;

-- 插入 PokerStars 盲注结构
WITH ps_template AS (
  SELECT id FROM tournament_templates WHERE normalized_name = 'pokerstars sunday million' LIMIT 1
)
INSERT INTO blind_levels (tournament_template_id, level_number, small_blind, big_blind, ante)
SELECT id, 1, 10, 20, 20 FROM ps_template
UNION ALL SELECT id, 2, 15, 30, 30 FROM ps_template
UNION ALL SELECT id, 3, 20, 40, 40 FROM ps_template
UNION ALL SELECT id, 4, 25, 50, 50 FROM ps_template
UNION ALL SELECT id, 5, 30, 60, 60 FROM ps_template
UNION ALL SELECT id, 6, 40, 80, 80 FROM ps_template
UNION ALL SELECT id, 7, 50, 100, 100 FROM ps_template
UNION ALL SELECT id, 8, 60, 120, 120 FROM ps_template
UNION ALL SELECT id, 9, 80, 160, 160 FROM ps_template
UNION ALL SELECT id, 10, 100, 200, 200 FROM ps_template
ON CONFLICT DO NOTHING;

-- 插入 GGPoker 标准赛事
INSERT INTO tournament_templates (name, normalized_name, game_type, buy_in, level_duration, info, source, is_public)
VALUES (
  'GGPoker 标准赛事',
  'ggpoker standard',
  '9max',
  100.00,
  12,
  'GGPoker 标准赛事 - 每级12分钟，200BB起始',
  'preset',
  TRUE
) ON CONFLICT DO NOTHING;

-- 插入 GGPoker 盲注结构
WITH gg_template AS (
  SELECT id FROM tournament_templates WHERE normalized_name = 'ggpoker standard' LIMIT 1
)
INSERT INTO blind_levels (tournament_template_id, level_number, small_blind, big_blind, ante)
SELECT id, 1, 25, 50, 50 FROM gg_template
UNION ALL SELECT id, 2, 30, 60, 60 FROM gg_template
UNION ALL SELECT id, 3, 40, 80, 80 FROM gg_template
UNION ALL SELECT id, 4, 50, 100, 100 FROM gg_template
UNION ALL SELECT id, 5, 60, 120, 120 FROM gg_template
UNION ALL SELECT id, 6, 80, 160, 160 FROM gg_template
UNION ALL SELECT id, 7, 100, 200, 200 FROM gg_template
UNION ALL SELECT id, 8, 125, 250, 250 FROM gg_template
UNION ALL SELECT id, 9, 150, 300, 300 FROM gg_template
UNION ALL SELECT id, 10, 200, 400, 400 FROM gg_template
ON CONFLICT DO NOTHING;

-- ============================================
-- 完成
-- ============================================
-- 数据库结构创建完成！
-- 
-- 主要表：
-- 1. tournament_templates - 比赛模板
-- 2. blind_levels - 盲注级别
-- 3. user_tournaments - 用户比赛实例
-- 4. hand_records - 手牌记录
--
-- 主要功能：
-- ✓ RLS 安全策略
-- ✓ 自动更新时间戳
-- ✓ 盲注级别查询函数
-- ✓ 使用统计
-- ✓ 预设常见比赛模板
-- ============================================
