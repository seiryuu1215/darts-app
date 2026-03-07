import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Container,
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface PricingPageStoryProps {
  variant: 'guest' | 'freeUser' | 'proUser' | 'promotional' | 'canceled';
}

const FEATURES = [
  { name: 'セッティング管理', free: '8件まで', pro: '無制限' },
  { name: 'DARTSLIVE連携', free: false, pro: true },
  { name: 'バレルDB検索', free: true, pro: true },
  { name: 'バレル診断', free: '基本', pro: '詳細分析' },
  { name: '掲示板投稿', free: false, pro: true },
  { name: 'マイショップ', free: '5件', pro: '無制限' },
  { name: 'レポート', free: false, pro: true },
];

const FAQ = [
  {
    q: '無料トライアルはありますか？',
    a: 'はい、PROプランは7日間の無料トライアルをご利用いただけます。',
  },
  {
    q: '解約はいつでもできますか？',
    a: 'はい、いつでもStripeポータルから解約できます。解約後も現在の請求期間終了まではPRO機能をご利用いただけます。',
  },
  {
    q: '支払い方法は？',
    a: 'クレジットカード（VISA, Mastercard, JCB, AMEX）に対応しています。',
  },
];

function PricingPageStory({ variant }: PricingPageStoryProps) {
  const isPromo = variant === 'promotional';
  const price = isPromo ? 480 : 580;
  const originalPrice = 580;

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 3, p: { xs: 1, sm: 2 } }}>
        {variant === 'canceled' && (
          <Alert severity="info" sx={{ mb: 2 }}>
            チェックアウトがキャンセルされました。
          </Alert>
        )}

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
            料金プラン
          </Typography>
          <Typography variant="body1" color="text.secondary">
            あなたのダーツライフをもっと充実させましょう
          </Typography>
        </Box>

        {/* Plan Cards */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {/* Free Plan */}
          <Paper variant="outlined" sx={{ p: 3, flex: '1 1 280px', maxWidth: 360 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              Free
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
              ¥0
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              基本機能をお試しいただけます
            </Typography>
            <Button variant="outlined" fullWidth disabled={variant !== 'guest'}>
              {variant === 'guest' ? '無料で始める' : '現在のプラン'}
            </Button>
          </Paper>

          {/* PRO Plan */}
          <Paper
            variant="outlined"
            sx={{
              p: 3,
              flex: '1 1 280px',
              maxWidth: 360,
              borderColor: 'primary.main',
              borderWidth: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                PRO
              </Typography>
              {isPromo && <Chip label="キャンペーン中" size="small" color="warning" />}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
              {isPromo && (
                <Typography
                  variant="h5"
                  sx={{ textDecoration: 'line-through', color: 'text.secondary' }}
                >
                  ¥{originalPrice}
                </Typography>
              )}
              <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                ¥{price}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                / 月
              </Typography>
            </Box>
            <Chip label="7日間無料トライアル" size="small" color="info" sx={{ mb: 2 }} />
            <Button variant="contained" fullWidth disabled={variant === 'proUser'}>
              {variant === 'proUser' ? 'ご利用中' : 'PROプランに登録'}
            </Button>
          </Paper>
        </Box>

        {/* Features Table */}
        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>機能</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                  Free
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  PRO
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {FEATURES.map((f) => (
                <TableRow key={f.name}>
                  <TableCell>{f.name}</TableCell>
                  <TableCell align="center">
                    {typeof f.free === 'boolean' ? (
                      f.free ? (
                        <CheckIcon sx={{ color: 'success.main' }} />
                      ) : (
                        <CloseIcon sx={{ color: 'text.disabled' }} />
                      )
                    ) : (
                      <Typography variant="body2">{f.free}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="center">
                    {typeof f.pro === 'boolean' ? (
                      <CheckIcon sx={{ color: 'success.main' }} />
                    ) : (
                      <Typography variant="body2" fontWeight="bold">
                        {f.pro}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* FAQ */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          よくある質問
        </Typography>
        {FAQ.map((faq) => (
          <Accordion key={faq.q} variant="outlined" sx={{ mb: 1 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="body2" fontWeight="bold">
                {faq.q}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" color="text.secondary">
                {faq.a}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    </Container>
  );
}

const meta = {
  title: 'Pages/Static/PricingPage',
  component: PricingPageStory,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PricingPageStory>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Guest: Story = {
  args: { variant: 'guest' },
};

export const FreeUser: Story = {
  args: { variant: 'freeUser' },
};

export const ProUser: Story = {
  args: { variant: 'proUser' },
};

export const Promotional: Story = {
  args: { variant: 'promotional' },
};

export const Canceled: Story = {
  args: { variant: 'canceled' },
};
