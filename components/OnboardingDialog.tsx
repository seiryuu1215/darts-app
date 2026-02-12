'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SettingsIcon from '@mui/icons-material/Settings';
import SearchIcon from '@mui/icons-material/Search';
import BarChartIcon from '@mui/icons-material/BarChart';
import Link from 'next/link';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface OnboardingDialogProps {
  open: boolean;
  userId: string;
  onClose: () => void;
}

const steps = [
  {
    label: 'プロフィールを設定',
    description: '表示名やアバター、利き目・スタンスなどを設定しましょう。他のプレイヤーがあなたのセッティングを見たときに参考になります。',
    icon: <PersonIcon />,
    href: '/profile/edit',
    action: 'プロフィール編集へ',
  },
  {
    label: '最初のセッティングを登録',
    description: '今使っているバレル・シャフト・フライト・チップを登録しましょう。スペックの合計値が自動計算されます。',
    icon: <SettingsIcon />,
    href: '/darts/new',
    action: 'セッティング登録へ',
  },
  {
    label: 'バレルを探す',
    description: '7,000種以上のバレルから検索したり、診断クイズであなたにぴったりのバレルを見つけましょう。',
    icon: <SearchIcon />,
    href: '/barrels',
    action: 'バレル検索へ',
  },
  {
    label: 'スタッツを確認（PRO）',
    description: 'DARTSLIVE連携でRating・PPD・MPRの推移をグラフで可視化。1週間の無料トライアルで全機能をお試しください。',
    icon: <BarChartIcon />,
    href: '/stats',
    action: 'スタッツへ',
  },
];

export default function OnboardingDialog({ open, userId, onClose }: OnboardingDialogProps) {
  const [activeStep, setActiveStep] = useState(0);

  const handleDismiss = async () => {
    try {
      await updateDoc(doc(db, 'users', userId), { onboardingCompleted: true });
    } catch {
      // ignore
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pt: 3 }}>
        <Typography variant="h5" fontWeight="bold">
          Darts Lab へようこそ
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          以下のステップで始めましょう
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} orientation="vertical">
          {steps.map((step, index) => (
            <Step key={step.label} completed={false}>
              <StepLabel
                onClick={() => setActiveStep(index)}
                sx={{ cursor: 'pointer' }}
                icon={
                  <Box sx={{
                    width: 32, height: 32, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    bgcolor: activeStep === index ? 'primary.main' : 'action.disabledBackground',
                    color: activeStep === index ? 'primary.contrastText' : 'text.secondary',
                    fontSize: 18,
                  }}>
                    {step.icon}
                  </Box>
                }
              >
                <Typography variant="subtitle2">{step.label}</Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {step.description}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="contained"
                    size="small"
                    component={Link}
                    href={step.href}
                    onClick={handleDismiss}
                  >
                    {step.action}
                  </Button>
                  {index < steps.length - 1 && (
                    <Button size="small" onClick={() => setActiveStep(index + 1)}>
                      スキップ
                    </Button>
                  )}
                </Box>
              </StepContent>
            </Step>
          ))}
        </Stepper>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleDismiss} color="inherit" size="small">
          あとで見る
        </Button>
      </DialogActions>
    </Dialog>
  );
}
