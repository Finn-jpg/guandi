import { useCallback, useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import type { Sign, Stage } from './types'
import signs from './data/guandi.json'
import { drawSign } from './hooks/useDivination'
import { requestMotionPermission } from './hooks/useShake'
import { trackVisit, recordDraw } from './lib/visitor'
import Welcome from './components/Welcome'
import JiaoToss from './components/JiaoToss'
import DrawSign from './components/DrawSign'
import SignResult from './components/SignResult'
import Closing from './components/Closing'

const SIGNS = signs as Sign[]

export default function App() {
  const [stage, setStage] = useState<Stage>('welcome')
  const [motionOk, setMotionOk] = useState(false)
  const [current, setCurrent] = useState<Sign | null>(null)

  // 上报访客(IP/地理位置),失败静默
  useEffect(() => {
    void trackVisit()
  }, [])

  // 入口"开始":在用户手势中请求摇一摇授权(iOS 必需)
  const handleStart = useCallback(async () => {
    const ok = await requestMotionPermission()
    setMotionOk(ok)
    setStage('ask')
  }, [])

  // 抽签:随机取一签
  const handleDraw = useCallback(() => {
    const no = drawSign(SIGNS.length)
    setCurrent(SIGNS.find((s) => s.no === no) ?? SIGNS[0])
    setStage('confirm')
  }, [])

  const reset = useCallback(() => {
    setCurrent(null)
    setStage('welcome')
  }, [])

  return (
    <main className="paper-grain relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {stage === 'welcome' && <Welcome key="welcome" onStart={handleStart} />}

        {stage === 'ask' && (
          <JiaoToss
            key="ask"
            motionOk={motionOk}
            eventKey="ask"
            title="请示帝爷公"
            subtitle="掷筊请示，可否为你抽签"
            onApproved={() => setStage('draw')}
          />
        )}

        {stage === 'draw' && <DrawSign key="draw" motionOk={motionOk} onDrawn={handleDraw} />}

        {stage === 'confirm' && current && (
          <JiaoToss
            key="confirm"
            motionOk={motionOk}
            eventKey="confirm"
            signNo={current.no}
            title={`第${current.no}签 ${current.ganzhi}`}
            subtitle="掷筊确认，此签是否为神佛钦定"
            onApproved={() => {
              void recordDraw(current)
              setStage('result')
            }}
            onRejected={() => setStage('draw')}
          />
        )}

        {stage === 'result' && current && (
          <SignResult key="result" sign={current} onClose={() => setStage('closing')} />
        )}

        {stage === 'closing' && <Closing key="closing" sign={current} onAgain={reset} />}
      </AnimatePresence>
    </main>
  )
}
