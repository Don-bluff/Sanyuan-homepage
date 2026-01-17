# HandRecordModal 组件拆分说明

## 组件结构

原来的 `HandRecordModal.tsx` (2356行) 已被拆分成以下小组件：

### 1. **TournamentInfo.tsx** - 比赛信息
处理比赛名称、游戏类型、最大玩家数的输入。

### 2. **BlindSettings.tsx** - 盲注设置
处理盲注模式、小盲、大盲、前注的设置。

### 3. **TournamentProgress.tsx** - 比赛进程
处理当前人数、总买入人数、钱圈位置的设置。

### 4. **DecisionItem.tsx** - 单个后续决策
展示和编辑单个后续决策（第2轮、第3轮等）。

### 5. **ActionItem.tsx** - 单个行动项
展示和编辑单个行动，包括：
- Hero 标记和手牌
- 位置选择
- 后手筹码
- 行动类型和金额
- 多轮后续决策

### 6. **StreetSection.tsx** - 街道部分
展示单个街道（Preflop/Flop/Turn/River）的所有行动。

### 7. **useActionLogic.ts** - 行动逻辑 Hook
包含所有行动相关的状态和逻辑：
- `actions` 状态
- 添加/更新/删除行动
- 添加/更新/删除后续决策
- 计算筹码、检查 ALL-IN 等辅助函数

## 主组件重构示例

```tsx
import { TournamentInfo } from './handRecord/TournamentInfo'
import { BlindSettings } from './handRecord/BlindSettings'
import { TournamentProgress } from './handRecord/TournamentProgress'
import { StreetSection } from './handRecord/StreetSection'
import { useActionLogic } from './handRecord/useActionLogic'

export function HandRecordModal({ isOpen, onClose, onSave, tournament }: HandRecordModalProps) {
  // 比赛信息状态
  const [tournamentName, setTournamentName] = useState('')
  const [gameType, setGameType] = useState<GameType>('6max')
  const [maxPlayers, setMaxPlayers] = useState(6)
  
  // 盲注设置状态
  const [blindMode, setBlindMode] = useState<BlindMode>('chips')
  const [smallBlind, setSmallBlind] = useState(50)
  const [bigBlind, setBigBlind] = useState(100)
  const [ante, setAnte] = useState(100)
  
  // 比赛进程状态
  const [currentPlayers, setCurrentPlayers] = useState(0)
  const [startingPlayers, setStartingPlayers] = useState(0)
  const [moneyBubble, setMoneyBubble] = useState(0)
  
  // 使用自定义 Hook 处理行动逻辑
  const {
    actions,
    getAvailablePositions,
    isPositionAllIn,
    getFoldedOrAllInPositionsBeforeStreet,
    handleAddAction,
    handleUpdateAction,
    handleRemoveAction,
    handleAddDecision,
    handleUpdateDecision,
    handleRemoveDecision
  } = useActionLogic()
  
  // 处理盲注模式切换
  const handleBlindModeChange = (mode: BlindMode) => {
    setBlindMode(mode)
    if (mode === 'bb') {
      setSmallBlind(0.5)
      setBigBlind(1)
      setAnte(1)
    } else {
      setSmallBlind(50)
      setBigBlind(100)
      setAnte(100)
    }
  }
  
  return (
    <div className="...">
      {/* 比赛信息 */}
      <TournamentInfo
        tournamentName={tournamentName}
        gameType={gameType}
        maxPlayers={maxPlayers}
        isLinked={!!tournament}
        onTournamentNameChange={setTournamentName}
        onGameTypeChange={setGameType}
        onMaxPlayersChange={setMaxPlayers}
      />
      
      {/* 盲注设置和比赛进程 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <BlindSettings
          blindMode={blindMode}
          smallBlind={smallBlind}
          bigBlind={bigBlind}
          ante={ante}
          isLinked={!!tournament}
          canUpgradeBlind={true}
          onBlindModeChange={handleBlindModeChange}
          onSmallBlindChange={setSmallBlind}
          onBigBlindChange={setBigBlind}
          onAnteChange={setAnte}
        />
        
        <TournamentProgress
          currentPlayers={currentPlayers}
          startingPlayers={startingPlayers}
          moneyBubble={moneyBubble}
          onCurrentPlayersChange={setCurrentPlayers}
          onStartingPlayersChange={setStartingPlayers}
          onMoneyBubbleChange={setMoneyBubble}
        />
      </div>
      
      {/* 行动线 */}
      <div className="space-y-3">
        <StreetSection
          street="preflop"
          title="翻牌前 (Preflop)"
          emoji="♠️"
          actions={actions.filter(a => a.street === 'preflop')}
          potSize={getInitialPot()}
          blindMode={blindMode}
          colorScheme={{
            header: 'text-blue-700',
            pot: 'bg-blue-100 text-blue-800',
            border: 'border-blue-200'
          }}
          onAddAction={() => handleAddAction('preflop')}
          onUpdateAction={handleUpdateAction}
          onRemoveAction={handleRemoveAction}
          onOpenCardSelector={openCardSelector}
          onAddDecision={handleAddDecision}
          onUpdateDecision={handleUpdateDecision}
          onRemoveDecision={handleRemoveDecision}
          getAvailablePositions={getAvailablePositions}
          isPositionAllIn={isPositionAllIn}
        />
        
        {/* 同样的方式添加 Flop, Turn, River */}
      </div>
    </div>
  )
}
```

## 优势

1. **可维护性提升**：每个组件专注于单一功能
2. **代码复用**：ActionItem 和 DecisionItem 可以在不同街道中复用
3. **测试更容易**：可以单独测试每个小组件
4. **可读性提高**：从 2356 行减少到多个 100-200 行的文件
5. **关注点分离**：UI 组件和逻辑分离（通过 useActionLogic）

## 下一步

完成主组件 `HandRecordModal.tsx` 的重构，将原有逻辑迁移到新的组件结构中。


