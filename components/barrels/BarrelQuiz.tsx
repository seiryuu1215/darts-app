'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Paper,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckIcon from '@mui/icons-material/Check';
import type { QuizAnswer } from '@/types';
import { BARREL_CUTS } from '@/lib/darts-parts';

interface BarrelQuizProps {
  onComplete: (answers: QuizAnswer) => void;
}

const STEPS = [
  'プレースタイル',
  'グリップ位置',
  '重さの好み',
  '長さの好み',
  '予算',
  'カットの好み',
];

interface OptionItem {
  value: string;
  label: string;
  description: string;
}

const PLAY_STYLE_OPTIONS: OptionItem[] = [
  { value: 'beginner', label: '初心者', description: 'ダーツを始めたばかり' },
  { value: 'intermediate', label: '中級者', description: 'Bフライト以上' },
  { value: 'advanced', label: '上級者', description: 'Aフライト以上' },
];

const GRIP_OPTIONS: OptionItem[] = [
  { value: 'front', label: '前方', description: 'バレルの前側をグリップ' },
  { value: 'center', label: '真ん中', description: '重心付近をグリップ' },
  { value: 'rear', label: '後方', description: 'バレルの後ろ側をグリップ' },
];

const WEIGHT_OPTIONS: OptionItem[] = [
  { value: 'light', label: '軽め (16-17g)', description: 'スピード重視の投げ方' },
  { value: 'medium', label: '標準 (18-20g)', description: '最も一般的な重量帯' },
  { value: 'heavy', label: '重め (21-24g)', description: '安定感・直進性重視' },
];

const LENGTH_OPTIONS: OptionItem[] = [
  { value: 'short', label: '短め (~42mm)', description: 'グルーピング重視' },
  { value: 'standard', label: '標準 (42-48mm)', description: '万能な長さ' },
  { value: 'long', label: '長め (48mm~)', description: '安定性重視' },
];

const BUDGET_OPTIONS: OptionItem[] = [
  { value: 'low', label: '~5,000円', description: 'エントリーモデル' },
  { value: 'mid', label: '5,000~15,000円', description: '主要メーカー品' },
  { value: 'high', label: '15,000円~', description: 'プロモデル・高級品' },
];

function OptionCards({
  options,
  value,
  onChange,
}: {
  options: OptionItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={(_, v) => v && onChange(v)}
      sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, justifyContent: 'center' }}
    >
      {options.map((opt) => (
        <ToggleButton
          key={opt.value}
          value={opt.value}
          sx={{
            flex: '1 1 auto',
            minWidth: 140,
            maxWidth: 200,
            display: 'flex',
            flexDirection: 'column',
            p: 2,
            borderRadius: '12px !important',
            border: '2px solid !important',
            borderColor: value === opt.value ? 'primary.main !important' : 'divider !important',
          }}
        >
          <Typography variant="subtitle1" fontWeight="bold">
            {opt.label}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {opt.description}
          </Typography>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}

export default function BarrelQuiz({ onComplete }: BarrelQuizProps) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Partial<QuizAnswer>>({
    cutPreference: [],
  });

  const canNext = () => {
    switch (step) {
      case 0:
        return !!answers.playStyle;
      case 1:
        return !!answers.gripPosition;
      case 2:
        return !!answers.weightPreference;
      case 3:
        return !!answers.lengthPreference;
      case 4:
        return true; // budget is optional
      case 5:
        return true; // cuts are optional
      default:
        return false;
    }
  };

  const handleFinish = () => {
    onComplete({
      playStyle: answers.playStyle || 'intermediate',
      gripPosition: answers.gripPosition || 'center',
      weightPreference: answers.weightPreference || 'medium',
      lengthPreference: answers.lengthPreference || 'standard',
      cutPreference: answers.cutPreference || [],
    });
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <OptionCards
            options={PLAY_STYLE_OPTIONS}
            value={answers.playStyle || ''}
            onChange={(v) => setAnswers({ ...answers, playStyle: v as QuizAnswer['playStyle'] })}
          />
        );
      case 1:
        return (
          <OptionCards
            options={GRIP_OPTIONS}
            value={answers.gripPosition || ''}
            onChange={(v) =>
              setAnswers({ ...answers, gripPosition: v as QuizAnswer['gripPosition'] })
            }
          />
        );
      case 2:
        return (
          <OptionCards
            options={WEIGHT_OPTIONS}
            value={answers.weightPreference || ''}
            onChange={(v) =>
              setAnswers({ ...answers, weightPreference: v as QuizAnswer['weightPreference'] })
            }
          />
        );
      case 3:
        return (
          <OptionCards
            options={LENGTH_OPTIONS}
            value={answers.lengthPreference || ''}
            onChange={(v) =>
              setAnswers({ ...answers, lengthPreference: v as QuizAnswer['lengthPreference'] })
            }
          />
        );
      case 4:
        return <OptionCards options={BUDGET_OPTIONS} value="" onChange={() => {}} />;
      case 5:
        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
            {BARREL_CUTS.map((cut) => {
              const selected = answers.cutPreference?.includes(cut);
              return (
                <Chip
                  key={cut}
                  label={cut}
                  variant={selected ? 'filled' : 'outlined'}
                  color={selected ? 'primary' : 'default'}
                  onClick={() => {
                    const cuts = answers.cutPreference || [];
                    setAnswers({
                      ...answers,
                      cutPreference: selected ? cuts.filter((c) => c !== cut) : [...cuts, cut],
                    });
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              );
            })}
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ width: '100%', textAlign: 'center', mt: 1 }}
            >
              複数選択可・スキップしてもOK
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Stepper activeStep={step} alternativeLabel sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Typography variant="h6" textAlign="center" sx={{ mb: 3 }}>
        {STEPS[step]}
      </Typography>

      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>{renderStep()}</Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button
          disabled={step === 0}
          onClick={() => setStep(step - 1)}
          startIcon={<ArrowBackIcon />}
        >
          戻る
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            variant="contained"
            disabled={!canNext()}
            onClick={() => setStep(step + 1)}
            endIcon={<ArrowForwardIcon />}
          >
            次へ
          </Button>
        ) : (
          <Button variant="contained" onClick={handleFinish} endIcon={<CheckIcon />}>
            結果を見る
          </Button>
        )}
      </Box>
    </Paper>
  );
}
