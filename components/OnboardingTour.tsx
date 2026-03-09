'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Backdrop, Box, Button, MobileStepper, Paper, Popper, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OnboardingTourProps {
  run: boolean;
  userId: string;
  onComplete: () => void;
}

interface TourStep {
  target: string | null; // CSS selector, null = center
  title: string;
  content: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    target: null,
    title: 'ようこそ！',
    content:
      'Darts Lab へようこそ！あなたのダーツライフをサポートするアプリです。簡単にツアーをご案内します。',
  },
  {
    target: '[data-tour-id="stats-overview"]',
    title: 'スタッツ概要',
    content:
      '今月のDARTSLIVEスタッツがここに表示されます。Rating・PPD・MPRの推移や前月比が一目で分かります。',
  },
  {
    target: '[data-tour-id="focus-points"]',
    title: '練習の意識ポイント',
    content: '練習で意識することを3つまで登録できます。日々の練習テーマを明確にしましょう。',
  },
  {
    target: '[data-tour-id="nav-スタッツ"]',
    title: 'スタッツメニュー',
    content: '詳細なスタッツ分析やカレンダー表示はここから。日別・月別の成績推移を確認できます。',
  },
  {
    target: '[data-tour-id="nav-ダーツ"]',
    title: 'ダーツメニュー',
    content: 'マイダーツのセッティング登録や履歴管理、バレル検索・ショップ探しはここから。',
  },
  {
    target: '[data-tour-id="nav-ツール"]',
    title: 'ツールメニュー',
    content: 'バレルシミュレーターや診断クイズなど、便利なツールが揃っています。',
  },
  {
    target: '[data-tour-id="theme-toggle"]',
    title: 'テーマ切替',
    content: 'ライトモードとダークモードを切り替えられます。お好みの表示を選んでください。',
  },
  {
    target: null,
    title: 'ツアー完了',
    content: '準備完了です！まずはセッティングを登録して、あなたのダーツ環境を記録してみましょう。',
  },
];

const BACKDROP_Z = 1300;
const TOOLTIP_Z = 1301;

export default function OnboardingTour({ run, userId, onComplete }: OnboardingTourProps) {
  const theme = useTheme();
  const [step, setStep] = useState(0);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);

  const currentStep = TOUR_STEPS[step];
  const isCenter = currentStep.target === null;

  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.style.removeProperty('position');
      highlightedRef.current.style.removeProperty('z-index');
      highlightedRef.current.style.removeProperty('box-shadow');
      highlightedRef.current = null;
    }
  }, []);

  // ターゲット要素を検索してハイライト
  useEffect(() => {
    if (!run) return;

    clearHighlight();

    // 遅延して要素を検索（DOM更新待ち + setState を async コールバックに）
    const timer = setTimeout(() => {
      if (isCenter) {
        setAnchorEl(null);
        return;
      }

      const el = document.querySelector<HTMLElement>(currentStep.target!);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const pos = getComputedStyle(el).position;
        if (pos === 'static') {
          el.style.position = 'relative';
        }
        el.style.zIndex = String(BACKDROP_Z + 1);
        el.style.boxShadow = `0 0 0 4px ${theme.palette.primary.main}, 0 0 16px rgba(0,0,0,0.3)`;
        highlightedRef.current = el;
        setAnchorEl(el);
      } else {
        setAnchorEl(null);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [run, step, isCenter, currentStep.target, theme.palette.primary.main, clearHighlight]);

  // ツアー終了時にクリーンアップ
  useEffect(() => {
    if (!run) clearHighlight();
  }, [run, clearHighlight]);

  const finishTour = useCallback(async () => {
    clearHighlight();
    try {
      await updateDoc(doc(db, 'users', userId), { onboardingCompleted: true });
    } catch {
      // ignore
    }
    setStep(0);
    setAnchorEl(null);
    onComplete();
  }, [userId, onComplete, clearHighlight]);

  const handleNext = useCallback(() => {
    if (step >= TOUR_STEPS.length - 1) {
      finishTour();
    } else {
      setStep((s) => s + 1);
    }
  }, [step, finishTour]);

  const handleBack = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  if (!run) return null;

  const tooltipContent = (
    <Paper
      elevation={8}
      sx={{
        p: 3,
        maxWidth: 380,
        borderRadius: 3,
        zIndex: TOOLTIP_Z,
        border: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1 }}>
        {currentStep.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.7 }}>
        {currentStep.content}
      </Typography>
      <MobileStepper
        variant="dots"
        steps={TOUR_STEPS.length}
        position="static"
        activeStep={step}
        sx={{ background: 'transparent', p: 0 }}
        backButton={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" color="inherit" onClick={finishTour} sx={{ fontSize: 13 }}>
              スキップ
            </Button>
            {step > 0 && (
              <Button size="small" onClick={handleBack} sx={{ fontSize: 13 }}>
                戻る
              </Button>
            )}
          </Box>
        }
        nextButton={
          <Button size="small" variant="contained" onClick={handleNext} sx={{ fontSize: 13 }}>
            {step >= TOUR_STEPS.length - 1 ? '完了' : '次へ'}
          </Button>
        }
      />
    </Paper>
  );

  return (
    <>
      <Backdrop open sx={{ zIndex: BACKDROP_Z, backgroundColor: 'rgba(0,0,0,0.6)' }} />
      {isCenter ? (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: TOOLTIP_Z,
          }}
        >
          {tooltipContent}
        </Box>
      ) : anchorEl ? (
        <Popper
          open
          anchorEl={anchorEl}
          placement="bottom"
          sx={{ zIndex: TOOLTIP_Z }}
          modifiers={[
            { name: 'offset', options: { offset: [0, 12] } },
            { name: 'preventOverflow', options: { padding: 16 } },
          ]}
        >
          {tooltipContent}
        </Popper>
      ) : null}
    </>
  );
}
